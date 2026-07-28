import { beforeEach, describe, expect, it, vi } from "vitest";
import { assignAgentTagCommand, getAgentTagsCommand } from "./tags";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputError: vi.fn(),
    outputJson: vi.fn(),
    outputSuccess: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("agent tag commands", () => {
  const root = {
    agent_id: "agent_1",
    tags: {
      prod: { version: 2, dynamic_variables: { region: "us" } },
      staging: { version: 3, dynamic_variables: { region: "ca" } },
    },
  };
  let client: any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {
      get: vi.fn().mockResolvedValue(root),
      patch: vi.fn().mockResolvedValue({}),
      agent: {
        getVersions: vi.fn().mockResolvedValue([
          { version: 2, is_published: true },
          { version: 3, is_published: false },
        ]),
      },
    };
    vi.mocked(retellClient.getRetellClient).mockReturnValue(client);
  });

  it("reads one tag version", async () => {
    await getAgentTagsCommand("agent_1", "prod");

    expect(outputFormatter.outputJson).toHaveBeenCalledWith({
      agent_id: "agent_1",
      tag: "prod",
      version: 2,
      dynamic_variables: { region: "us" },
    });
  });

  it("previews an assignment without patching", async () => {
    await assignAgentTagCommand("agent_1", "staging", {
      agentVersion: "3",
      dryRun: true,
    });

    expect(client.patch).not.toHaveBeenCalled();
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        dry_run: true,
        tag: "staging",
        previous_version: 3,
        version: 3,
      }),
    );
  });

  it("preserves every tag and dynamic variable while assigning", async () => {
    client.get.mockResolvedValueOnce(root).mockResolvedValueOnce({
      ...root,
      tags: { ...root.tags, prod: { ...root.tags.prod, version: 3 } },
    });

    await assignAgentTagCommand("agent_1", "prod", { agentVersion: "3" });

    expect(client.get).toHaveBeenCalledTimes(2);
    expect(client.patch).toHaveBeenCalledWith("/update-agent-root/agent_1", {
      body: {
        tags: {
          prod: { version: 3, dynamic_variables: { region: "us" } },
          staging: { version: 3, dynamic_variables: { region: "ca" } },
        },
      },
    });
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ dry_run: false, tag: "prod", version: 3 }),
    );
  });

  it("fails when the final read does not confirm the assignment", async () => {
    vi.mocked(outputFormatter.outputError).mockImplementationOnce(() => {
      throw new Error("reported");
    });

    await assignAgentTagCommand("agent_1", "prod", { agentVersion: "3" });

    expect(client.get).toHaveBeenCalledTimes(2);
    expect(outputFormatter.outputError).toHaveBeenCalledWith(
      "Retell did not assign tag 'prod' to version 3",
      "VERIFICATION_ERROR",
      expect.objectContaining({ retryable: true }),
    );
    expect(outputFormatter.outputSuccess).not.toHaveBeenCalled();
  });

  it("rejects unknown tags before patching", async () => {
    await assignAgentTagCommand("agent_1", "production", {
      agentVersion: "3",
    });

    expect(client.patch).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
  });

  it("rejects unknown versions before reading or patching tags", async () => {
    await assignAgentTagCommand("agent_1", "prod", { agentVersion: "99" });

    expect(client.get).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
  });
});
