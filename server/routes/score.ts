import { Router, type Request, type Response } from "express";
import {
  scoreRequestSchema,
  scoreResultSchema,
  type ScoreResultDTO,
} from "../schemas.js";
import { heuristicScore } from "../lib/scoreEngine.js";
import { getLLMConfig } from "../lib/ai.js";

export const scoreRouter = Router();

async function aiScore(
  resumeText: string,
  jobDescription: string
): Promise<ScoreResultDTO> {
  const llm = getLLMConfig()!;

  const prompt =
    "You are an elite ATS analyst and résumé reviewer. Score the résumé from " +
    "0-100 on overall, impact, keywords, formatting, and completeness. Provide " +
    "a 2-sentence plain-English summary, up to 5 concrete topIssues, and up to " +
    "5 topStrengths. Be direct and tactical.\n\n" +
    `RÉSUMÉ:\n${resumeText.slice(0, 12000)}\n\n` +
    `TARGET JOB DESCRIPTION:\n${
      jobDescription ? jobDescription.slice(0, 6000) : "(none provided)"
    }\n\n` +
    "Respond ONLY with valid JSON matching this exact shape:\n" +
    '{"overall":N,"impact":N,"keywords":N,"formatting":N,"completeness":N,' +
    '"summary":"...","topIssues":["..."],"topStrengths":["..."]}';

  if (llm.provider === "openai") {
    const { ChatOpenAI } = await import("@langchain/openai");
    const model = new ChatOpenAI({
      model: llm.model,
      temperature: 0,
      apiKey: llm.apiKey,
    });
    const structured = model.withStructuredOutput(scoreResultSchema, {
      name: "resume_score",
    });
    return structured.invoke(prompt);
  }

  const resp = await fetch(`${llm.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llm.apiKey}`,
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: 0,
      messages: [
        { role: "system", content: "You are a JSON-only API. Return raw JSON, no markdown fences." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`LLM API ${resp.status}`);
  const data = (await resp.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = data.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return scoreResultSchema.parse(JSON.parse(cleaned));
}

scoreRouter.post("/", async (req: Request, res: Response) => {
  const parsed = scoreRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ errors: [{ code: 400, message: "resumeText is required." }] });
  }

  const { resumeText, jobDescription } = parsed.data;
  const fallback = heuristicScore(resumeText, jobDescription);

  if (!getLLMConfig()) {
    res.setHeader("X-Score-Engine", "heuristic");
    return res.json(fallback);
  }

  try {
    const ai = scoreResultSchema.parse(await aiScore(resumeText, jobDescription));
    res.setHeader("X-Score-Engine", "ai");
    return res.json(ai);
  } catch {
    res.setHeader("X-Score-Engine", "heuristic-fallback");
    return res.json(fallback);
  }
});
