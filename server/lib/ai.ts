export function hasOpenAIKey(): boolean {
  const k = process.env.OPENAI_API_KEY?.trim();
  return (
    !!k &&
    k.startsWith("sk-") &&
    k.length > 20 &&
    !k.toUpperCase().includes("REPLACE")
  );
}

export function hasGroqKey(): boolean {
  const k = process.env.GROQ_API_KEY?.trim();
  return !!k && k.startsWith("gsk_") && k.length > 20;
}

export function hasAnyLLMKey(): boolean {
  return hasOpenAIKey() || hasGroqKey();
}

export interface LLMConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  provider: "openai" | "groq";
}

export function getLLMConfig(): LLMConfig | null {
  if (hasOpenAIKey()) {
    return {
      apiKey: process.env.OPENAI_API_KEY!.trim(),
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4o",
      provider: "openai",
    };
  }
  if (hasGroqKey()) {
    return {
      apiKey: process.env.GROQ_API_KEY!.trim(),
      baseURL: "https://api.groq.com/openai/v1",
      model: "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }
  return null;
}
