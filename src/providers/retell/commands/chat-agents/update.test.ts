import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { updateChatAgentCommand } from "./update";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";
import { RetellPayloadValidationError } from "../../services/agent-payload";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputJson: vi.fn(),
    handleSdkError: vi.fn(),
    filterFields: vi.fn((data, _fields) => data),
  };
});

describe("updateChatAgentCommand", () => {
  let mockClient: any;
  const tmpFile = join(tmpdir(), `voice-agent-cli-ca-upd-${process.pid}.json`);

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      chatAgent: { update: vi.fn().mockResolvedValue({ agent_id: "ca_1" }) },
    };
    vi.mocked(retellClient.getRetellClient).mockReturnValue(mockClient);
  });

  afterEach(() => {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  });

  it("sends body from --file", async () => {
    writeFileSync(tmpFile, JSON.stringify({ agent_name: "New" }));
    await updateChatAgentCommand("ca_1", { file: tmpFile });
    expect(mockClient.chatAgent.update).toHaveBeenCalledWith("ca_1", {
      agent_name: "New",
    });
  });

  it("rejects missing file", async () => {
    await updateChatAgentCommand("ca_1", { file: "/nonexistent-x.json" });
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
  });

  it("rejects empty body file", async () => {
    writeFileSync(tmpFile, JSON.stringify({}));
    await updateChatAgentCommand("ca_1", { file: tmpFile });
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
    expect(mockClient.chatAgent.update).not.toHaveBeenCalled();
  });

  it("rejects deprecated file payloads before update", async () => {
    writeFileSync(
      tmpFile,
      JSON.stringify({ analysis_user_sentiment_prompt: "Classify sentiment" }),
    );

    await updateChatAgentCommand("ca_1", { file: tmpFile });

    expect(mockClient.chatAgent.update).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.any(RetellPayloadValidationError),
    );
  });

  it("passes current analysis and locale fields unchanged", async () => {
    const body = {
      language: ["en-US", "es-ES"],
      post_chat_analysis_data: [
        {
          type: "system-presets",
          name: "chat_summary",
          description: "Summarize",
        },
      ],
    };
    writeFileSync(tmpFile, JSON.stringify(body));

    await updateChatAgentCommand("ca_1", { file: tmpFile });

    expect(mockClient.chatAgent.update).toHaveBeenCalledWith("ca_1", body);
  });
});
