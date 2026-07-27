import { describe, it, expect, vi, beforeEach } from "vitest";
import { listAgentsCommand } from "./list";
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

describe("listAgentsCommand", () => {
  let mockClient: any;

  const mockAgents = [
    {
      agent_id: "agent_1",
      agent_name: "Support Agent",
      channel: "voice",
      tags: { production: { version: 2 } },
      user_modified_timestamp: 1_753_590_000_000,
    },
    {
      agent_id: "agent_2",
      agent_name: "Flow Agent",
      channel: "voice",
      tags: {},
      user_modified_timestamp: 1_753_590_001_000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      agent: {
        list: vi.fn().mockResolvedValue({
          items: mockAgents,
          has_more: true,
          pagination_key: "next-page",
        }),
      },
    };

    vi.mocked(retellClient.getRetellClient).mockReturnValue(mockClient);
  });

  it("outputs paginated agent summaries", async () => {
    await listAgentsCommand({ limit: 25, paginationKey: "page-2" });

    expect(mockClient.agent.list).toHaveBeenCalledWith({
      limit: 25,
      pagination_key: "page-2",
      filter_criteria: {
        channel: {
          op: "eq",
          type: "string",
          value: "voice",
        },
      },
    });
    expect(outputFormatter.outputJson).toHaveBeenCalledWith({
      items: mockAgents,
      has_more: true,
      pagination_key: "next-page",
    });
  });

  it("applies field filtering without dropping pagination metadata", async () => {
    await listAgentsCommand({
      limit: 25,
      fields: "agent_id,agent_name",
    });

    expect(outputFormatter.filterFields).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          agent_id: "agent_1",
          agent_name: "Support Agent",
        }),
      ]),
      ["agent_id", "agent_name"],
    );
    expect(outputFormatter.outputJson).toHaveBeenCalledWith({
      items: mockAgents,
      has_more: true,
      pagination_key: "next-page",
    });
  });

  it("rejects retired response wrappers", async () => {
    mockClient.agent.list.mockResolvedValue({
      agents: [{ agent_id: "agent_3" }],
    });

    await listAgentsCommand();

    expect(outputFormatter.outputJson).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("POST /v2/list-agents"),
      }),
    );
  });

  it("handles API errors via handleSdkError", async () => {
    const apiError = new Error("API Error");
    mockClient.agent.list.mockRejectedValue(apiError);

    await listAgentsCommand({ limit: 25 });

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(apiError);
  });
});
