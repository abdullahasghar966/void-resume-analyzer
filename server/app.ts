import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { parseRouter } from "./routes/parse.js";
import { scoreRouter } from "./routes/score.js";
import { matchRouter } from "./routes/match.js";
import { chatRouter } from "./routes/chat.js";

const app = express();

// Behind a proxy/load balancer (Vercel, Render, …) the client IP is in
// X-Forwarded-For; trust one hop so the per-IP rate limit sees real visitors.
if (process.env.TRUST_PROXY || process.env.VERCEL) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
}
export const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"] }));

// Per-IP rate limit (brief: RATE_LIMIT_RPM, default 20/min). Shapes the 429
// body into our standard { errors: [...] } contract.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: Number(process.env.RATE_LIMIT_RPM ?? 20),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      errors: [{ code: 429, message: "Too many requests. Slow down a moment." }],
    },
  })
);

// JSON only for non-upload routes; the parser route uses multipart via multer.
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() });
});


app.use("/api/parse", parseRouter);
app.use("/api/score", scoreRouter);
app.use("/api/match", matchRouter);
app.use("/api/chat", chatRouter);

// Centralised error shape. 4-arg arity is what marks this as Express error
// middleware; `_next` is unused but required (underscore satisfies lint).
// Known client errors (body-parser, payload size) get clean human messages;
// genuine 5xx never leak internal error strings to the client.
app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as {
      status?: number;
      statusCode?: number;
      type?: string;
      message?: string;
    };
    const status = e.status ?? e.statusCode ?? 500;

    let message = "Internal server error.";
    if (e.type === "entity.parse.failed") message = "Malformed JSON body.";
    else if (e.type === "entity.too.large") message = "Request body too large.";
    else if (status < 500 && e.message) message = e.message;

    res.status(status).json({ errors: [{ code: status, message }] });
  }
);

export default app;
