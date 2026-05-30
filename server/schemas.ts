import { z } from "zod";

export const fileTypeSchema = z.enum(["pdf", "docx", "txt"]);

/** Contract for POST /api/parse — validated server-side before responding. */
export const parseResultSchema = z.object({
  text: z.string(),
  wordCount: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
  fileType: fileTypeSchema,
  tokenEstimate: z.number().int().nonnegative(),
});

export type ParseResultDTO = z.infer<typeof parseResultSchema>;
export type FileTypeDTO = z.infer<typeof fileTypeSchema>;

// ── POST /api/score ─────────────────────────────────────────────────
const score = () => z.number().int().min(0).max(100);

export const scoreRequestSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().optional().default(""),
});

export const scoreResultSchema = z.object({
  overall: score(),
  impact: score(),
  keywords: score(),
  formatting: score(),
  completeness: score(),
  summary: z.string(),
  topIssues: z.array(z.string()).max(5),
  topStrengths: z.array(z.string()).max(5),
});

export type ScoreRequestDTO = z.infer<typeof scoreRequestSchema>;
export type ScoreResultDTO = z.infer<typeof scoreResultSchema>;

// ── POST /api/match ─────────────────────────────────────────────────
export const matchRequestSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().min(1),
});

export const resumeHighlightSchema = z.object({
  text: z.string(),
  linkedKeywords: z.array(z.string()),
});

export const matchResultSchema = z.object({
  matched: z.array(z.string()),
  missing: z.array(z.string()),
  partial: z.array(z.string()),
  resumeHighlights: z.array(resumeHighlightSchema).max(8),
  semanticScore: z.number().int().min(0).max(100),
});

export type MatchRequestDTO = z.infer<typeof matchRequestSchema>;
export type MatchResultDTO = z.infer<typeof matchResultSchema>;

// ── POST /api/chat (SSE stream) ─────────────────────────────────────
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const chatContextSchema = z.object({
  resumeText: z.string().default(""),
  jobDescription: z.string().default(""),
  scores: scoreResultSchema.nullable().default(null),
  missingKeywords: z.array(z.string()).default([]),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  context: chatContextSchema.default({}),
});

export type ChatMessageDTO = z.infer<typeof chatMessageSchema>;
export type ChatContextDTO = z.infer<typeof chatContextSchema>;
export type ChatRequestDTO = z.infer<typeof chatRequestSchema>;
