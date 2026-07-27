import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigError } from "../../services/config";
import * as outputFormatter from "../../services/output-formatter";
import * as retellClient from "../../services/retell-client";
import { getAgentCommand } from "./get";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputJson: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("getAgentCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes client configuration errors through the command error boundary", async () => {
    const error = new ConfigError("No configuration found", "NO_CONFIG");
    vi.mocked(retellClient.getRetellClient).mockImplementation(() => {
      throw error;
    });

    await getAgentCommand("agent_1", {});

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
  });
});
