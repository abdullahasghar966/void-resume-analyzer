import { Router, type Request, type Response } from "express";
import { chatRequestSchema } from "../schemas";
import { buildSystemPrompt, coachAnswer } from "../lib/coachFallback";
import { getLLMConfig } from "../lib/ai";

export const chatRouter = Router();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

chatRouter.post("/", async (req: Request, res: Response) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ errors: [{ code: 400, message: "messages are required." }] });
  }
  const { messages, context } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let aborted = false;
  res.on("close", () => {
    if (!res.writableFinished) aborted = true;
  });

  const send = (token: string) => res.write(`data: ${JSON.stringify(token)}\n\n`);

  let streamedViaAI = false;

  try {
    const llm = getLLMConfig();
    if (llm) {
      try {
        const apiRes = await fetch(`${llm.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${llm.apiKey}`,
          },
          body: JSON.stringify({
            model: llm.model,
            stream: true,
            messages: [
              { role: "system", content: buildSystemPrompt(context) },
              ...messages,
            ],
          }),
        });

        if (!apiRes.ok || !apiRes.body) {
          throw new Error(`LLM API ${apiRes.status}`);
        }

        streamedViaAI = true;
        const reader = apiRes.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (aborted) break;
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") break;
            try {
              const obj = JSON.parse(payload) as {
                choices: { delta: { content?: string } }[];
              };
              const token = obj.choices[0]?.delta?.content ?? "";
              if (token) send(token);
            } catch {
              /* skip malformed chunks */
            }
          }
        }
      } catch (err) {
        const e = err as Error & { cause?: Error };
        console.error("[CHAT] LLM error:", e.message, e.cause ? `| cause: ${e.cause.message}` : "", e.cause?.cause ?? "");
        streamedViaAI = false;
      }
    }

    if (!streamedViaAI && !aborted) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const answer = coachAnswer(lastUser?.content ?? "", context);
      const tokens = answer.match(/\S+\s*/g) ?? [answer];
      for (const tok of tokens) {
        if (aborted) break;
        send(tok);
        await sleep(16);
      }
    }

    if (!aborted) res.write("data: [DONE]\n\n");
  } catch {
    if (!aborted) {
      send("\n\n[The coach hit an error finishing that reply — please try again.]");
      res.write("data: [DONE]\n\n");
    }
  } finally {
    res.end();
  }
});
