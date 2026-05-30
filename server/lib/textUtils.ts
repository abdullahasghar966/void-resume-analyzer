// Shared text-analysis helpers used by both the score and match engines.

export const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "was", "were",
  "this", "that", "from", "will", "have", "has", "not", "but", "all", "can",
  "who", "why", "how", "what", "when", "into", "than", "then", "they", "their",
  "them", "via", "per", "etc", "such", "able", "must", "should", "would",
  "a", "an", "of", "to", "in", "on", "at", "as", "is", "it", "be", "by", "or",
  "we", "i", "plus", "using", "use", "used", "including", "include",
]);

export const ACTION_VERBS = new Set([
  "led", "built", "shipped", "designed", "launched", "reduced", "increased",
  "improved", "drove", "owned", "created", "developed", "implemented",
  "optimized", "scaled", "mentored", "architected", "delivered", "spearheaded",
  "automated", "migrated", "streamlined", "negotiated", "managed", "founded",
  "grew", "cut", "saved", "accelerated", "boosted", "established",
]);

/** Lowercase word tokens (length ≥ 3), stopwords removed. */
export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z][a-z+.#-]{2,}/g) ?? [];
  return matches
    // keep internal punctuation (node.js, c++) but trim it from the edges
    // so "valued." / "experience." don't become distinct tokens
    .map((w) => w.replace(/^[.#+-]+|[.#+-]+$/g, ""))
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Most frequent meaningful terms, highest first. */
export function topTerms(text: string, limit = 30): string[] {
  const freq = new Map<string, number>();
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/** Split into sentence-ish units (sentence punctuation OR line breaks). */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Crude suffix-stripping stem so "manage/manager/management" can align. */
export function stem(word: string): string {
  return word.replace(/(ings|ing|ments|ment|tions|tion|ities|ity|ers|er|ed|es|s)$/, "");
}
