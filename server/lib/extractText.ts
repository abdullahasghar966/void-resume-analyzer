import mammoth from "mammoth";
// Import the lib entry directly — the package index runs a debug harness that
// tries to read a bundled sample PDF when `module.parent` is undefined (ESM).
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export interface Extracted {
  text: string;
  pageCount: number;
}

const CHARS_PER_PAGE = 1800; // rough proxy for docx/txt page estimation

export async function extractPdf(buffer: Buffer): Promise<Extracted> {
  const data = await pdfParse(buffer);
  return { text: data.text ?? "", pageCount: data.numpages || 1 };
}

export async function extractDocx(buffer: Buffer): Promise<Extracted> {
  // extractRawText gives clean text without the HTML round-trip + tag stripping.
  const { value } = await mammoth.extractRawText({ buffer });
  return {
    text: value,
    pageCount: Math.max(1, Math.ceil(value.length / CHARS_PER_PAGE)),
  };
}

export function extractTxt(buffer: Buffer): Extracted {
  const text = buffer.toString("utf-8");
  return {
    text,
    pageCount: Math.max(1, Math.ceil(text.length / CHARS_PER_PAGE)),
  };
}

export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Predict the AI cost of this resume before any model call fires.
 * ~1.35 tokens/word is a safe English-prose heuristic (brief addition).
 */
export function estimateTokens(wordCount: number): number {
  return Math.ceil(wordCount * 1.35);
}
