import type { CliErrorInput } from "../../../core/cli-response";

export type AgentResource = "voice" | "chat";

export class RetellPayloadValidationError extends Error {
  readonly code = "DEPRECATED_RETELL_PAYLOAD";
  readonly retryable = false;

  constructor(
    message: string,
    readonly nextSteps: CliErrorInput["nextSteps"],
  ) {
    super(message);
    this.name = "RetellPayloadValidationError";
  }
}

const REMOVED_ANALYSIS_FIELDS = [
  "analysis_summary_prompt",
  "analysis_successful_prompt",
  "analysis_user_sentiment_prompt",
] as const;

const ANALYSIS_PRESETS = {
  analysis_summary_prompt: { voice: "call_summary", chat: "chat_summary" },
  analysis_successful_prompt: {
    voice: "call_successful",
    chat: "chat_successful",
  },
  analysis_user_sentiment_prompt: {
    voice: "user_sentiment",
    chat: "user_sentiment",
  },
} as const;

export function validateCurrentAgentPayload<T extends Record<string, unknown>>(
  payload: T,
  resource: AgentResource,
): T {
  if (payload.language === "multi") {
    throw new RetellPayloadValidationError(
      '`language: "multi"` is no longer supported by Retell.',
      [
        'Replace it with an explicit locale array, for example `language: ["en-US", "es-ES"]`.',
      ],
    );
  }

  const removed = REMOVED_ANALYSIS_FIELDS.filter((field) =>
    Object.hasOwn(payload, field),
  );
  if (removed.length > 0) {
    const replacement =
      resource === "voice"
        ? "post_call_analysis_data"
        : "post_chat_analysis_data";
    const nextSteps = removed.map(
      (field) =>
        `Move \`${field}\` to \`${replacement}\` as {"type":"system-presets","name":"${ANALYSIS_PRESETS[field][resource]}","description":"<prompt>"}.`,
    ) as [string, ...string[]];
    throw new RetellPayloadValidationError(
      `Removed Retell analysis fields: ${removed.join(", ")}.`,
      nextSteps,
    );
  }

  return payload;
}
