import { beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "path";
import { pullPromptsCommand } from "./pull";
import { diffPromptsCommand } from "./diff";
import { updatePromptsCommand } from "./update";
import { loadLocalPrompts } from "../../services/prompt-loader";
import { outputError } from "../../services/output-formatter";

const mocks = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  resolvePromptSource: vi.fn(),
  generateDiff: vi.fn(),
}));

vi.mock("fs", () => ({
  mkdirSync: mocks.mkdirSync,
  writeFileSync: mocks.writeFileSync,
  existsSync: mocks.existsSync,
  readFileSync: mocks.readFileSync,
}));

vi.mock("../../services/prompt-resolver", () => ({
  resolvePromptSource: mocks.resolvePromptSource,
}));

vi.mock("../../services/prompt-loader", () => ({
  loadLocalPrompts: vi.fn(),
}));

vi.mock("../../services/prompt-diff", () => ({
  generateDiff: mocks.generateDiff,
}));

vi.mock("../../services/output-formatter", () => ({
  outputJson: vi.fn(),
  outputSuccess: vi.fn(),
  outputError: vi.fn(),
  handleSdkError: vi.fn((error: unknown) => {
    throw error;
  }),
  filterFields: vi.fn((value: unknown) => value),
}));

vi.mock("../../services/retell-client", () => ({
  getRetellClient: vi.fn(),
}));

describe("prompt storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolvePromptSource.mockResolvedValue({
      type: "retell-llm",
      llmId: "llm_123",
      agentName: "Test Agent",
      prompts: { version: 1, general_prompt: "Hello" },
    });
    vi.mocked(loadLocalPrompts).mockReturnValue({
      type: "retell-llm",
      metadata: {
        type: "retell-llm",
        agent_name: "Test Agent",
        llm_id: "llm_123",
        version: 1,
        pulled_at: "2026-07-27T00:00:00.000Z",
      },
      prompts: { general_prompt: "Hello" },
    });
    mocks.generateDiff.mockReturnValue({ has_changes: false });
  });

  it("pulls into the provider-specific Voice Agent directory by default", async () => {
    await pullPromptsCommand("agent_123", {});

    expect(mocks.mkdirSync).toHaveBeenCalledWith(
      join(".voice-agent", "retell", "prompts", "agent_123"),
      { recursive: true },
    );
  });

  it("diffs from the provider-specific Voice Agent directory by default", async () => {
    await diffPromptsCommand("agent_123", {});

    expect(loadLocalPrompts).toHaveBeenCalledWith(
      "agent_123",
      join(".voice-agent", "retell", "prompts", "agent_123"),
    );
  });

  it("uses the provider namespace in missing-directory guidance", async () => {
    mocks.existsSync.mockReturnValue(false);

    await updatePromptsCommand("agent_123", {});

    expect(outputError).toHaveBeenCalledWith(
      "Prompts directory not found: .voice-agent/retell/prompts/agent_123. Run 'vac retell prompts pull agent_123' first.",
      "DIRECTORY_NOT_FOUND",
    );
  });
});
