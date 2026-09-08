import { gateway } from "@ai-sdk/gateway";

const DEFAULT_MODEL = "openai/gpt-5.5";

export function getResearchModel() {
  const modelId = process.env.PRODUCTFORGE_AI_MODEL?.trim() || DEFAULT_MODEL;
  return gateway.languageModel(modelId);
}
