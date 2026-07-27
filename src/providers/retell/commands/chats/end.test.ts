import { describe, it, expect, vi, beforeEach } from "vitest";
import { endChatCommand } from "./end";
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

describe("endChatCommand", () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { chat: { end: vi.fn().mockResolvedValue(undefined) } };
    vi.mocked(retellClient.getRetellClient).mockReturnValue(mockClient);
  });

  it("ends the chat", async () => {
    await endChatCommand("chat_1");
    expect(mockClient.chat.end).toHaveBeenCalledWith("chat_1");
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ chat_id: "chat_1", operation: "end" }),
    );
  });
});
