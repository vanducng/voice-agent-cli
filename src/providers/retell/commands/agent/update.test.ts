import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigError } from "../../services/config";
import * as outputFormatter from "../../services/output-formatter";
import * as retellClient from "../../services/retell-client";
import { updateAgentCommand } from "./update";

vi.mock("../../services/retell-client");
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
  });

  it("routes client configuration errors through the command error boundary", async () => {
    const error = new ConfigError("Invalid configuration", "INVALID_CONFIG");
    vi.mocked(retellClient.getRetellClient).mockImplementation(() => {
      throw error;
    });

    await updateAgentCommand("agent_1", { file: "unused.json" });

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
  });
});
