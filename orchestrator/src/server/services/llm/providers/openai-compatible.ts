import type { LlmRequestOptions, ResponseMode } from "../types";
import { buildHeaders, joinUrl } from "../utils/http";
import {
  buildChatCompletionsBody,
  createProviderStrategy,
  extractChatCompletionsText,
} from "./factory";

export const openAiCompatibleStrategy = createProviderStrategy({
  provider: "openai_compatible",
  defaultBaseUrl: "https://api.openai.com",
  requiresApiKey: true,
  modes: ["json_schema", "json_object", "none"],
  validationPaths: ["/v1/models"],
  buildRequest: ({ mode, baseUrl, apiKey, model, messages, jsonSchema }) => {
    const input = ensureJsonInstructionIfNeeded(messages, mode);
    return {
      url: joinUrl(baseUrl, "/v1/chat/completions"),
      headers: buildHeaders({ apiKey, provider: "openai_compatible" }),
      body: buildChatCompletionsBody({
        mode,
        model,
        messages: input,
        jsonSchema,
      }),
    };
  },
  extractText: extractChatCompletionsText,
});

function ensureJsonInstructionIfNeeded(
  messages: LlmRequestOptions<unknown>["messages"],
  mode: ResponseMode,
) {
  if (mode !== "json_object") return messages;
  const hasJson = messages.some((message) =>
    message.content.toLowerCase().includes("json"),
  );
  if (hasJson) return messages;
  return [
    {
      role: "system" as const,
      content: "Respond with valid JSON.",
    },
    ...messages,
  ];
}
