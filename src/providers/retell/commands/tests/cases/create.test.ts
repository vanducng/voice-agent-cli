import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestCaseDefinition } from "../../../services/test-api";
import * as outputFormatter from "../../../services/output-formatter";
import { createTestCaseCommand } from "./create";

vi.mock("fs", () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(),
}));
vi.mock("../../../services/test-api", () => ({
  createTestCaseDefinition: vi.fn(),
}));
vi.mock("../../../services/output-formatter", () => ({
  outputSuccess: vi.fn(),
  outputError: vi.fn(),
  handleSdkError: vi.fn(),
}));

import { readFileSync } from "fs";

describe("createTestCaseCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTestCaseDefinition).mockResolvedValue({
      test_case_definition_id: "tcd_1",
      creation_timestamp: 1,
      dynamic_variables: {},
      llm_model: "gpt-5.4",
      name: "Greeting",
      user_prompt: "Hello",
      metrics: ["task_completion"],
      response_engine: { type: "retell-llm", llm_id: "llm_1" },
      tool_mocks: [],
      type: "simulation",
      user_modified_timestamp: 1,
    });
  });

  it("forwards the current test-case contract", async () => {
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        name: "Greeting",
        user_prompt: "Hello",
        metrics: ["task_completion"],
      }),
    );

    await createTestCaseCommand({ file: "test.json", llmId: "llm_1" });

    expect(createTestCaseDefinition).toHaveBeenCalledWith({
      name: "Greeting",
      user_prompt: "Hello",
      metrics: ["task_completion"],
      response_engine: { type: "retell-llm", llm_id: "llm_1" },
      dynamic_variables: undefined,
      tool_mocks: undefined,
      llm_model: undefined,
    });
  });

  it("rejects payloads missing the current user_prompt field", async () => {
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({ name: "Greeting", metrics: ["task_completion"] }),
    );

    await createTestCaseCommand({ file: "test.json", llmId: "llm_1" });

    expect(outputFormatter.outputError).toHaveBeenCalledWith(
      'Test case must have a "user_prompt" field',
      "INVALID_INPUT",
    );
    expect(createTestCaseDefinition).not.toHaveBeenCalled();
  });
});
