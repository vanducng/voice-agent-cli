import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatAgentVersionsCommand } from "./versions";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";

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

describe("chatAgentVersionsCommand", () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      agent: {
        listVersions: vi.fn().mockResolvedValue({ items: [], has_more: false }),
      },
    };
    vi.mocked(retellClient.getRetellClient).mockReturnValue(mockClient);
  });

  it("lists chat agent versions through the unified endpoint", async () => {
    await chatAgentVersionsCommand("ca_1");
    expect(mockClient.agent.listVersions).toHaveBeenCalledWith("ca_1", {});
  });

  it("routes SDK errors through handleSdkError", async () => {
    mockClient.agent.listVersions.mockRejectedValue(new Error("api"));
    await chatAgentVersionsCommand("ca_1");
    expect(outputFormatter.handleSdkError).toHaveBeenCalled();
  });
});
