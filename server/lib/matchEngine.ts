import type { MatchResultDTO } from "../schemas.js";
import { ACTION_VERBS, sentences, stem, tokenize, topTerms } from "./textUtils.js";

/**
 * Deterministic résumé↔JD matcher (no API key required). Classifies the JD's
 * key terms as matched / partial / missing against the résumé, extracts the
 * most impactful résumé sentences, and derives an aggregate semantic score.
 *
 * In production with a key, an embeddings pass (text-embedding-3-small) would
 * refine the "partial" bucket via cosine similarity; this stem/substring
 * heuristic is the always-available approximation and the LLM fallback.
 */
export function heuristicMatch(
  resumeText: string,
  jobDescription: string
): MatchResultDTO {
  const jdKeywords = topTerms(jobDescription, 24);
  const resumeTokens = new Set(tokenize(resumeText));
  const resumeStems = new Set([...resumeTokens].map(stem));

  const matched: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    if (resumeTokens.has(kw)) {
      matched.push(kw);
    } else if (
      resumeStems.has(stem(kw)) ||
      [...resumeTokens].some(
        (t) => t.length > 3 && (t.includes(kw) || kw.includes(t))
      )
    ) {
      partial.push(kw);
    } else {
      missing.push(kw);
    }
  }

  // ── Top résumé highlights ──
  const jdSet = new Set(jdKeywords);
  const highlights = sentences(resumeText)
    .filter((s) => s.split(/\s+/).length >= 5)
    .map((s) => {
      const toks = tokenize(s);
      const linked = [...new Set(toks.filter((t) => jdSet.has(t)))];
      const quant = /\d/.test(s) ? 1 : 0;
      const verbs = toks.filter((t) => ACTION_VERBS.has(t)).length;
      const score = linked.length * 3 + quant * 2 + verbs;
      return { text: s, linkedKeywords: linked.slice(0, 5), score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ text, linkedKeywords }) => ({ text, linkedKeywords }));

  const denom = jdKeywords.length || 1;
  const semanticScore = Math.max(
    0,
    Math.min(100, Math.round(((matched.length + 0.5 * partial.length) / denom) * 100))
  );

  return { matched, missing, partial, resumeHighlights: highlights, semanticScore };
}
