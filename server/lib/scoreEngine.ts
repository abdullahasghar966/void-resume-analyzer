import type { ScoreResultDTO } from "../schemas.js";
import { ACTION_VERBS, tokenize, topTerms } from "./textUtils.js";

/**
 * Deterministic, no-API-key résumé scorer. Produces believable, input-sensitive
 * ATS-style sub-scores from structural signals (action verbs, quantified
 * results, sections, contact info, length, JD keyword overlap). Used as the
 * default engine and as the graceful fallback when the LLM call fails.
 */

const SECTION_HINTS = [
  "experience", "education", "skill", "summary", "project",
  "certification", "employment", "work history", "achievement",
];

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

export function heuristicScore(
  resumeText: string,
  jobDescription = ""
): ScoreResultDTO {
  const lower = resumeText.toLowerCase();
  const wordCount = (resumeText.match(/\S+/g) ?? []).length;
  const lines = resumeText.split(/\r?\n/);

  // ── Impact: quantified results + action verbs ──
  const quant = (resumeText.match(/(\d+(\.\d+)?\s?%|\$\s?\d|\b\d{2,}\b)/g) ?? [])
    .length;
  const verbHits = tokenize(resumeText).filter((w) => ACTION_VERBS.has(w)).length;
  const impact = clamp(30 + quant * 6 + verbHits * 3);

  // ── Keywords: JD overlap when provided, else term breadth ──
  let keywords: number;
  let missingKeywords: string[] = [];
  if (jobDescription.trim()) {
    const jdTerms = topTerms(jobDescription, 30);
    const resumeSet = new Set(tokenize(resumeText));
    const matched = jdTerms.filter((t) => resumeSet.has(t));
    missingKeywords = jdTerms.filter((t) => !resumeSet.has(t)).slice(0, 5);
    keywords = clamp(jdTerms.length ? (matched.length / jdTerms.length) * 100 : 60);
  } else {
    const distinct = new Set(tokenize(resumeText)).size;
    keywords = clamp(45 + Math.min(distinct, 120) * 0.35);
  }

  // ── Formatting: sections + bullets + contact ──
  const sectionsFound = SECTION_HINTS.filter((h) => lower.includes(h)).length;
  const bullets = lines.filter((l) => /^\s*[-•*]/.test(l)).length;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(resumeText);
  const formatting = clamp(
    35 + sectionsFound * 8 + (bullets >= 3 ? 16 : bullets * 4) + (hasEmail ? 10 : 0)
  );

  // ── Completeness: healthy length + dates + sections ──
  const lengthScore =
    wordCount >= 350 && wordCount <= 900
      ? 100
      : wordCount < 350
        ? (wordCount / 350) * 100
        : Math.max(40, 100 - (wordCount - 900) / 20);
  const hasDates = /(19|20)\d{2}/.test(resumeText);
  const completeness = clamp(
    lengthScore * 0.6 + sectionsFound * 7 + (hasDates ? 12 : 0)
  );

  const overall = clamp(
    impact * 0.3 + keywords * 0.3 + formatting * 0.2 + completeness * 0.2
  );

  // ── Narrative ──
  const strengths: string[] = [];
  const issues: string[] = [];

  if (quant >= 3) strengths.push("Strong use of quantified, measurable results.");
  else issues.push("Add more quantified results (numbers, %, $).");

  if (verbHits >= 4) strengths.push("Bullets are driven by strong action verbs.");
  else issues.push("Open bullet points with strong action verbs.");

  if (sectionsFound >= 4) strengths.push("Clear, well-labelled sections.");
  else issues.push("Add clearly labelled sections (Experience, Skills, Education).");

  if (hasEmail) strengths.push("Reachable contact information is present.");
  else issues.push("Include reachable contact details (email).");

  if (hasDates) strengths.push("Employment timeline / dates are present.");

  if (jobDescription.trim() && missingKeywords.length)
    issues.push(`Missing job-description keywords: ${missingKeywords.join(", ")}.`);
  if (wordCount < 350) issues.push("Résumé is short — expand on impact and scope.");
  if (wordCount > 1100)
    issues.push("Résumé is long — tighten to the most relevant wins.");

  const band =
    overall >= 80 ? "strong" : overall >= 60 ? "solid" : overall >= 40 ? "developing" : "early-stage";
  const summary =
    `This résumé scores ${overall}/100 overall — a ${band} profile` +
    `${jobDescription.trim() ? " against the target role" : ""}. ` +
    `${issues[0] ?? "Tighten wording and keep quantifying impact to push higher."}`;

  return {
    overall,
    impact,
    keywords,
    formatting,
    completeness,
    summary,
    topIssues: issues.slice(0, 5),
    topStrengths: strengths.slice(0, 5),
  };
}
