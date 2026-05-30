// ── Shared domain types ─────────────────────────────────────────────

export type FileType = "pdf" | "docx" | "txt";

export interface FileMeta {
  fileName: string;
  fileType: FileType;
  wordCount: number;
  pageCount: number;
  tokenEstimate: number;
}

export interface ParseResult {
  text: string;
  wordCount: number;
  pageCount: number;
  fileType: FileType;
  tokenEstimate: number;
}

// ── Module 2: scoring ───────────────────────────────────────────────
export interface ScoreResult {
  overall: number;
  impact: number;
  keywords: number;
  formatting: number;
  completeness: number;
  summary: string;
  topIssues: string[];
  topStrengths: string[];
}

// ── Module 3: semantic match ────────────────────────────────────────
export interface ResumeHighlight {
  text: string;
  linkedKeywords: string[];
}

export interface MatchResult {
  matched: string[];
  missing: string[];
  partial: string[];
  resumeHighlights: ResumeHighlight[];
  semanticScore: number;
}

// ── Async lifecycle ─────────────────────────────────────────────────
export type AsyncStatus = "idle" | "parsing" | "scoring" | "done" | "error";

// ── Module 4: chat ──────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Toasts ──────────────────────────────────────────────────────────
export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  /** ms before auto-dismiss; defaults to 4000 in the viewport. */
  duration?: number;
}
