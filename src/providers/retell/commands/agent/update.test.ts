import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "fs";
import { ConfigError } from "../../services/config";
import { RetellPayloadValidationError } from "../../services/agent-payload";
import * as outputFormatter from "../../services/output-formatter";
import * as retellClient from "../../services/retell-client";
import { updateAgentCommand } from "./update";

vi.mock("../../services/retell-client");
vi.mock("fs");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputSuccess: vi.fn(),
    outputError: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("updateAgentCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{"agent_name":"Current"}');
  });

  it("updates the requested draft version", async () => {
    const update = vi.fn().mockResolvedValue({
      agent_id: "agent_1",
      agent_name: "Current",
      version: 4,
    });
    vi.mocked(retellClient.getRetellClient).mockReturnValue({
      agent: { update },
    } as never);

    await updateAgentCommand("agent_1", {
      file: "agent.json",
      version: 4,
    });

    expect(update).toHaveBeenCalledWith("agent_1", {
      agent_name: "Current",
      version: 4,
    });
  });

  it("routes client configuration errors through the command error boundary", async () => {
    const error = new ConfigError("Invalid configuration", "INVALID_CONFIG");
    vi.mocked(retellClient.getRetellClient).mockImplementation(() => {
      throw error;
    });

    await updateAgentCommand("agent_1", { file: "unused.json" });

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
  });

  it("rejects deprecated payloads before dry-run retrieval", async () => {
    const retrieve = vi.fn();
    const update = vi.fn();
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ analysis_successful_prompt: "Was it successful?" }),
    );
    vi.mocked(retellClient.getRetellClient).mockReturnValue({
      agent: { retrieve, update },
    } as never);

    await updateAgentCommand("agent_1", {
      file: "agent.json",
      dryRun: true,
    });

    expect(retrieve).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.any(RetellPayloadValidationError),
    );
  });

  it("passes current analysis and locale fields unchanged", async () => {
    const update = vi.fn().mockResolvedValue({
      agent_id: "agent_1",
      agent_name: "Current",
      version: 5,
    });
    const payload = {
      language: ["en-US", "es-ES"],
      post_call_analysis_data: [
        {
          type: "system-presets",
          name: "call_summary",
          description: "Summarize",
        },
      ],
    };
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(payload));
    vi.mocked(retellClient.getRetellClient).mockReturnValue({
      agent: { update },
    } as never);

    await updateAgentCommand("agent_1", { file: "agent.json" });

    expect(update).toHaveBeenCalledWith("agent_1", payload);
  });
});
