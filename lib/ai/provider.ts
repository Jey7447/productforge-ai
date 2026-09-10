import { openai } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-5.6-luna";

export function getResearchModel() {
  const modelId = process.env.PRODUCTFORGE_AI_MODEL?.trim() || DEFAULT_MODEL;
  return openai(modelId);
}
