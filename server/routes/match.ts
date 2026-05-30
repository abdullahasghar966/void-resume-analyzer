import { Router, type Request, type Response } from "express";
import {
  matchRequestSchema,
  matchResultSchema,
  type MatchResultDTO,
} from "../schemas";
import { heuristicMatch } from "../lib/matchEngine";
import { getLLMConfig } from "../lib/ai";

export const matchRouter = Router();

async function aiMatch(
  resumeText: string,
  jobDescription: string
): Promise<MatchResultDTO> {
  const llm = getLLMConfig()!;

  const prompt =
    "Compare the résumé against the job description. Return: matched (JD " +
    "keywords clearly present), partial (semantically related / weaker), " +
    "missing (absent JD keywords), up to 8 resumeHighlights (the most " +
    "impactful résumé sentences, each with its linkedKeywords), and a 0-100 " +
    "semanticScore for overall alignment.\n\n" +
    `RÉSUMÉ:\n${resumeText.slice(0, 12000)}\n\n` +
    `JOB DESCRIPTION:\n${jobDescription.slice(0, 6000)}\n\n` +
    "Respond ONLY with valid JSON matching this exact shape:\n" +
    '{"matched":["..."],"missing":["..."],"partial":["..."],' +
    '"resumeHighlights":[{"text":"...","linkedKeywords":["..."]}],' +
    '"semanticScore":N}';

  if (llm.provider === "openai") {
    const { ChatOpenAI } = await import("@langchain/openai");
    const model = new ChatOpenAI({
      model: llm.model,
      temperature: 0,
      apiKey: llm.apiKey,
    });
    const structured = model.withStructuredOutput(matchResultSchema, {
      name: "semantic_match",
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
  return matchResultSchema.parse(JSON.parse(cleaned));
}

matchRouter.post("/", async (req: Request, res: Response) => {
  const parsed = matchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: [
        { code: 400, message: "resumeText and jobDescription are required." },
      ],
    });
  }

  const { resumeText, jobDescription } = parsed.data;
  const fallback = heuristicMatch(resumeText, jobDescription);

  if (!getLLMConfig()) {
    res.setHeader("X-Match-Engine", "heuristic");
    return res.json(fallback);
  }

  try {
    const ai = matchResultSchema.parse(await aiMatch(resumeText, jobDescription));
    res.setHeader("X-Match-Engine", "ai");
    return res.json(ai);
  } catch {
    res.setHeader("X-Match-Engine", "heuristic-fallback");
    return res.json(fallback);
  }
});
