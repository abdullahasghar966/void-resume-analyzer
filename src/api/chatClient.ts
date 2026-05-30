import type { ChatMessage, ScoreResult } from "@/types";

export interface ChatContext {
  resumeText: string;
  jobDescription: string;
  scores: ScoreResult | null;
  missingKeywords: string[];
}

export interface ChatPayload {
  messages: Pick<ChatMessage, "role" | "content">[];
  context: ChatContext;
}

/**
 * Consumes the /api/chat SSE stream. Events are `data: <json>\n\n`; tokens are
 * JSON-encoded so embedded newlines/quotes survive. A buffer carries any
 * partial event across network chunks, so we never split a token mid-flight.
 * `onToken` fires per token; resolves when `[DONE]` arrives or the stream ends.
 */
export async function streamChat(
  payload: ChatPayload,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = `Chat failed (${res.status}).`;
    try {
      const body = (await res.json()) as { errors?: { message: string }[] };
      if (body.errors?.[0]?.message) message = body.errors[0].message;
    } catch {
      /* keep status message */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? ""; // last item may be a partial event

    for (const evt of events) {
      const line = evt.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      try {
        onToken(JSON.parse(data) as string);
      } catch {
        onToken(data);
      }
    }
  }
}
