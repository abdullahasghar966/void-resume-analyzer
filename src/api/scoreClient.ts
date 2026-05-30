import type { ScoreResult } from "@/types";

interface ApiError {
  errors?: { code: number; message: string }[];
}

/**
 * Calls POST /api/score. The server always returns a valid score (real AI when
 * an OpenAI key is set, deterministic heuristic otherwise), so the UI never has
 * to branch on which engine ran.
 */
export async function scoreResume(
  resumeText: string,
  jobDescription = ""
): Promise<ScoreResult> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  if (!res.ok) {
    let message = `Scoring failed (${res.status}).`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.errors?.[0]?.message) message = body.errors[0].message;
    } catch {
      /* keep status message */
    }
    throw new Error(message);
  }

  return (await res.json()) as ScoreResult;
}
