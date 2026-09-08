import { beforeEach, describe, expect, it, vi } from "vitest";
import { agentVersionsCommand } from "./versions";
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

describe("agentVersionsCommand", () => {
  let mockClient: any;

  const mockVersions = [
    {
      version: 1,
      is_published: true,
      last_modification_timestamp: 1700000000000,
      version_title: "Launch",
    },
    {
      version: 2,
      is_published: false,
      last_modification_timestamp: 1700100000000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      agent: {
        listVersions: vi.fn().mockResolvedValue({
          items: mockVersions,
          has_more: true,
          pagination_key: "next-page",
        }),
      },
    };

    vi.mocked(retellClient.getRetellClient).mockReturnValue(mockClient);
  });

  it("outputs paginated version summaries", async () => {
    await agentVersionsCommand("agent_123", {
      limit: "10",
      paginationKey: "page-2",
    });

    expect(mockClient.agent.listVersions).toHaveBeenCalledWith("agent_123", {
      limit: 10,
      pagination_key: "page-2",
    });
    expect(outputFormatter.outputJson).toHaveBeenCalledWith({
      items: mockVersions,
      has_more: true,
      pagination_key: "next-page",
    });
  });

  it("handles an empty versions page", async () => {
    mockClient.agent.listVersions.mockResolvedValue({
      items: [],
      has_more: false,
    });

    await agentVersionsCommand("agent_123");

    expect(outputFormatter.outputJson).toHaveBeenCalledWith({
      items: [],
      has_more: false,
    });
  });

  it("applies field filtering without dropping pagination metadata", async () => {
    await agentVersionsCommand("agent_123", {
      fields: "version,is_published",
    });

    expect(outputFormatter.filterFields).toHaveBeenCalledWith(
      expect.any(Array),
      ["version", "is_published"],
    );
    expect(outputFormatter.outputJson).toHaveBeenCalledWith({
      items: mockVersions,
      has_more: true,
      pagination_key: "next-page",
    });
  });

  it("rejects retired version arrays", async () => {
    mockClient.agent.listVersions.mockResolvedValue(mockVersions);

    await agentVersionsCommand("agent_123");

    expect(outputFormatter.outputJson).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("GET /list-agent-versions"),
      }),
    );
  });

  it("rejects non-numeric --limit", async () => {
    await agentVersionsCommand("agent_123", { limit: "x" });

    expect(mockClient.agent.listVersions).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
  });

  it("handles API errors via handleSdkError", async () => {
    const apiError = new Error("Agent not found");
    mockClient.agent.listVersions.mockRejectedValue(apiError);

    await agentVersionsCommand("nonexistent_agent");

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(apiError);
  });
});
