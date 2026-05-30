import type { ParseResult } from "@/types";

interface ApiError {
  errors?: { code: number; message: string }[];
}

/**
 * Uploads a resume to POST /api/parse. On a non-2xx response it extracts the
 * server's human-readable error and throws it, so the caller can surface the
 * exact reason via toast (never a raw status code).
 *
 * `signal` lets the caller abort an in-flight parse when a newer file is
 * dropped (rapid-interaction edge case).
 */
export async function parseResume(
  file: File,
  signal?: AbortSignal
): Promise<ParseResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/parse", {
    method: "POST",
    body: form,
    signal,
  });

  if (!res.ok) {
    let message = `Parse failed (${res.status}).`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.errors?.[0]?.message) message = body.errors[0].message;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(message);
  }

  return (await res.json()) as ParseResult;
}
