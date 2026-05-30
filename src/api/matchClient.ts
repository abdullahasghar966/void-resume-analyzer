import type { MatchResult } from "@/types";

interface ApiError {
  errors?: { code: number; message: string }[];
}

/**
 * Calls POST /api/match. Returns matched/missing/partial keywords, the top
 * résumé highlights, and an aggregate semantic score (AI when keyed, heuristic
 * otherwise — the client doesn't need to know which).
 */
export async function matchResume(
  resumeText: string,
  jobDescription: string
): Promise<MatchResult> {
  const res = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  if (!res.ok) {
    let message = `Match failed (${res.status}).`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.errors?.[0]?.message) message = body.errors[0].message;
    } catch {
      /* keep status message */
    }
    throw new Error(message);
  }

  return (await res.json()) as MatchResult;
}
