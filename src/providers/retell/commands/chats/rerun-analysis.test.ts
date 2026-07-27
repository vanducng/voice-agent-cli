import { beforeEach, describe, expect, it, vi } from "vitest";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";
import { rerunChatAnalysisCommand } from "./rerun-analysis";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputJson: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("rerunChatAnalysisCommand", () => {
  const response = {
    chat_id: "chat_1",
    chat_status: "ended",
    chat_analysis: { chat_summary: "Updated summary" },
  };
  const put = vi.fn().mockResolvedValue(response);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(retellClient.getRetellClient).mockReturnValue({ put } as never);
  });

  it("reruns chat analysis without automatic retries", async () => {
    await rerunChatAnalysisCommand("chat/1");

    expect(put).toHaveBeenCalledWith("/rerun-chat-analysis/chat%2F1", {
      maxRetries: 0,
    });
    expect(outputFormatter.outputJson).toHaveBeenCalledWith(response);
  });

  it("delegates SDK errors", async () => {
    const error = new Error("request failed");
    put.mockRejectedValueOnce(error);

    await rerunChatAnalysisCommand("chat_1");

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
    expect(outputFormatter.outputJson).not.toHaveBeenCalled();
  });
});
