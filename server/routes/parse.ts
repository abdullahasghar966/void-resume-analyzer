import { Router, type Request, type Response } from "express";
import multer, { MulterError } from "multer";
import {
  countWords,
  estimateTokens,
  extractDocx,
  extractPdf,
  extractTxt,
  type Extracted,
} from "../lib/extractText.js";
import { parseResultSchema, type FileTypeDTO } from "../schemas.js";

const MAX_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 5);
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Null byte some extractors emit — built without an escape sequence on purpose.
const NULL_CHAR = String.fromCharCode(0);

const MIME_TO_TYPE: Record<string, FileTypeDTO> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
};

const upload = multer({
  storage: multer.memoryStorage(), // small files; never touch disk
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    // Accept by MIME, falling back to extension (browser MIME for docx/txt
    // is inconsistent, especially on Windows).
    const ext = file.originalname.toLowerCase().split(".").pop() ?? "";
    const ok =
      file.mimetype in MIME_TO_TYPE || ["pdf", "docx", "txt"].includes(ext);
    if (ok) cb(null, true);
    else cb(new Error("Unsupported file type. Use PDF, DOCX, or TXT."));
  },
});

function resolveType(mimetype: string, originalname: string): FileTypeDTO {
  if (mimetype in MIME_TO_TYPE) return MIME_TO_TYPE[mimetype];
  const ext = originalname.toLowerCase().split(".").pop();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  return "txt";
}

export const parseRouter = Router();

parseRouter.post("/", (req: Request, res: Response) => {
  // Run multer manually so we can shape upload errors into our error contract.
  upload.single("file")(req, res, async (err: unknown) => {
    if (err instanceof MulterError) {
      const tooBig = err.code === "LIMIT_FILE_SIZE";
      const code = tooBig ? 413 : 400;
      const message = tooBig
        ? `File exceeds the ${MAX_MB} MB limit.`
        : err.message;
      return res.status(code).json({ errors: [{ code, message }] });
    }
    if (err instanceof Error) {
      return res
        .status(400)
        .json({ errors: [{ code: 400, message: err.message }] });
    }

    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ errors: [{ code: 400, message: "No file received." }] });
    }

    const fileType = resolveType(file.mimetype, file.originalname);

    try {
      let extracted: Extracted;
      if (fileType === "pdf") extracted = await extractPdf(file.buffer);
      else if (fileType === "docx") extracted = await extractDocx(file.buffer);
      else extracted = extractTxt(file.buffer);

      // Remove any null bytes a PDF may embed, then trim the edges.
      const text = extracted.text.split(NULL_CHAR).join("").trim();

      // Guard empty / scanned-image documents → clear, actionable 422.
      if (text.length < 20) {
        return res.status(422).json({
          errors: [
            {
              code: 422,
              message:
                "No extractable text found. If this is a scanned PDF, upload a text-based version.",
            },
          ],
        });
      }

      const wordCount = countWords(text);
      const payload = parseResultSchema.parse({
        text,
        wordCount,
        pageCount: extracted.pageCount,
        fileType,
        tokenEstimate: estimateTokens(wordCount),
      });

      return res.json(payload);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to parse the document.";
      return res.status(500).json({ errors: [{ code: 500, message }] });
    }
  });
});
