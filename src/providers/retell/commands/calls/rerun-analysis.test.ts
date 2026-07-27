import { beforeEach, describe, expect, it, vi } from "vitest";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";
import { rerunCallAnalysisCommand } from "./rerun-analysis";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputJson: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("rerunCallAnalysisCommand", () => {
  const response = {
    call_id: "call_1",
    call_status: "ended",
    call_analysis: { call_summary: "Updated summary" },
  };
  const put = vi.fn().mockResolvedValue(response);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(retellClient.getRetellClient).mockReturnValue({ put } as never);
  });

  it("reruns call analysis without automatic retries", async () => {
    await rerunCallAnalysisCommand("call/1");

    expect(put).toHaveBeenCalledWith("/rerun-call-analysis/call%2F1", {
      maxRetries: 0,
    });
    expect(outputFormatter.outputJson).toHaveBeenCalledWith(response);
  });

  it("delegates SDK errors", async () => {
    const error = new Error("request failed");
    put.mockRejectedValueOnce(error);

    await rerunCallAnalysisCommand("call_1");

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
    expect(outputFormatter.outputJson).not.toHaveBeenCalled();
  });
});
