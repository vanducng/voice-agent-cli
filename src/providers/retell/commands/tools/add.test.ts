import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "fs";
import * as outputFormatter from "../../services/output-formatter";
import * as retellClient from "../../services/retell-client";
import * as toolResolver from "../../services/tool-resolver";
import { addToolCommand } from "./add";

vi.mock("fs");
vi.mock("../../services/retell-client");
vi.mock("../../services/tool-resolver");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputSuccess: vi.fn(),
    outputError: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("addToolCommand", () => {
  const retrieve = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(toolResolver.resolveToolsSource).mockResolvedValue({
      type: "conversation-flow",
      agentId: "agent_1",
      agentName: "Support",
      flowId: "flow_1",
      flowTools: [],
      componentTools: {},
      totalCount: 0,
    });
    vi.mocked(toolResolver.getAllToolNames).mockReturnValue([]);
    retrieve.mockResolvedValue({ tools: [] });
    update.mockResolvedValue(undefined);
    vi.mocked(retellClient.getRetellClient).mockReturnValue({
      conversationFlow: { retrieve, update },
    } as never);
  });

  it("generates and returns a missing conversation-flow custom tool ID", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        name: "send_sms",
        type: "custom",
        url: "https://example.com/messages",
      }),
    );

    await addToolCommand("agent_1", { file: "tool.json" });

    const tool = update.mock.calls[0][1].tools[0];
    expect(tool.tool_id).toMatch(/^tool-[0-9a-f-]{36}$/);
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ tool_id: tool.tool_id }),
    );
  });

  it("preserves a supplied conversation-flow custom tool ID", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        name: "send_sms",
        type: "custom",
        tool_id: "tool-existing",
      }),
    );

    await addToolCommand("agent_1", { file: "tool.json" });

    expect(update.mock.calls[0][1].tools[0].tool_id).toBe("tool-existing");
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ tool_id: "tool-existing" }),
    );
  });
});
