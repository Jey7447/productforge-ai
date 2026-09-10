import { openai } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-5.6-luna";

export function getResearchModel() {
  const configuredModel = process.env.PRODUCTFORGE_AI_MODEL?.trim();

  // Older local environments used the AI Gateway model identifier.
  // Keep those stale values from silently routing research back through the gateway.
  const modelId =
    !configuredModel || configuredModel === "openai/gpt-5.5" || configuredModel === "gpt-5.5"
      ? DEFAULT_MODEL
      : configuredModel.replace(/^openai\//, "");

  return openai(modelId);
}
