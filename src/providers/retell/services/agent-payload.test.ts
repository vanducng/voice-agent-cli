import { describe, expect, it } from "vitest";
import {
  RetellPayloadValidationError,
  validateCurrentAgentPayload,
} from "./agent-payload";

describe("validateCurrentAgentPayload", () => {
  it("rejects the removed multi language scalar", () => {
    expect(() =>
      validateCurrentAgentPayload({ language: "multi" }, "voice"),
    ).toThrow(RetellPayloadValidationError);
  });

  it.each([
    ["analysis_summary_prompt", "call_summary"],
    ["analysis_successful_prompt", "call_successful"],
    ["analysis_user_sentiment_prompt", "user_sentiment"],
  ])("rejects removed analysis field %s", (field, preset) => {
    try {
      validateCurrentAgentPayload({ [field]: "Prompt" }, "voice");
      throw new Error("Expected payload validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(RetellPayloadValidationError);
      expect(error).toMatchObject({
        nextSteps: [expect.stringContaining(`"name":"${preset}"`)],
      });
    }
  });

  it("maps removed chat prompts to current chat presets", () => {
    try {
      validateCurrentAgentPayload(
        {
          analysis_summary_prompt: "Summary",
          analysis_successful_prompt: "Success",
          analysis_user_sentiment_prompt: "Sentiment",
        },
        "chat",
      );
      throw new Error("Expected payload validation to fail");
    } catch (error) {
      expect(error).toMatchObject({
        nextSteps: [
          expect.stringContaining('"name":"chat_summary"'),
          expect.stringContaining('"name":"chat_successful"'),
          expect.stringContaining('"name":"user_sentiment"'),
        ],
      });
    }
  });

  it.each([
    [
      "voice" as const,
      { language: ["en-US", "es-ES"], post_call_analysis_data: [] },
    ],
    [
      "chat" as const,
      { language: ["en-US", "es-ES"], post_chat_analysis_data: [] },
    ],
  ])("accepts current %s payloads unchanged", (resource, payload) => {
    expect(validateCurrentAgentPayload(payload, resource)).toBe(payload);
  });
});
