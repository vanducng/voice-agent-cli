import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishChatAgentCommand } from "./publish";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputSuccess: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("publishChatAgentCommand", () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      chatAgent: {
        getVersions: vi.fn().mockResolvedValue([
          { version: 1, is_published: true },
          { version: 3, is_published: false },
          { version: 2, is_published: false },
        ]),
        publish: vi.fn().mockResolvedValue(undefined),
      },
    };
    vi.mocked(retellClient.getRetellClient).mockReturnValue(mockClient);
  });

  it("publishes the explicit chat agent version", async () => {
    await publishChatAgentCommand("ca_1", {
      version: "0",
      description: "Release copy",
    });
    expect(mockClient.chatAgent.publish).toHaveBeenCalledWith("ca_1", {
      version: 0,
      version_description: "Release copy",
    });
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: "ca_1",
        operation: "publish",
        version: 0,
      }),
    );
  });

  it("auto-selects the newest unpublished version", async () => {
    await publishChatAgentCommand("ca_1");

    expect(mockClient.chatAgent.getVersions).toHaveBeenCalledWith("ca_1");
    expect(mockClient.chatAgent.publish).toHaveBeenCalledWith("ca_1", {
      version: 3,
    });
  });

  it("rejects publish when no unpublished draft exists", async () => {
    mockClient.chatAgent.getVersions.mockResolvedValue([
      { version: 1, is_published: true },
    ]);

    await publishChatAgentCommand("ca_1");

    expect(mockClient.chatAgent.publish).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
  });

  it("reconciles a publish error when the target version is published", async () => {
    mockClient.chatAgent.publish.mockRejectedValue(new Error("api"));
    await publishChatAgentCommand("ca_1", { version: "1" });
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ version: 1, reconciled: true }),
    );
    expect(outputFormatter.handleSdkError).not.toHaveBeenCalled();
  });

  it("routes unconfirmed SDK errors through handleSdkError", async () => {
    const error = new Error("api");
    mockClient.chatAgent.publish.mockRejectedValue(error);
    await publishChatAgentCommand("ca_1", { version: "4" });
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
  });
});
