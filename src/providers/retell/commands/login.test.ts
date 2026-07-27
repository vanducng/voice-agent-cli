import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginCommand } from "./login";
import * as config from "../services/config";
import * as outputFormatter from "../services/output-formatter";

const mocks = vi.hoisted(() => {
  return {
    question: vi.fn(),
    close: vi.fn(),
    agentList: vi.fn(),
    retellCtor: vi.fn(),
    stdin: { isTTY: true },
    stdout: { isTTY: true, write: vi.fn() },
  };
});

vi.mock("node:process", () => ({
  stdin: mocks.stdin,
  stdout: mocks.stdout,
}));

vi.mock("readline/promises", () => ({
  createInterface: vi.fn(() => ({
    question: mocks.question,
    close: mocks.close,
  })),
}));

vi.mock("retell-sdk", () => ({
  default: mocks.retellCtor,
}));

vi.mock("../services/config");
vi.mock("../services/output-formatter", () => ({
  outputSuccess: vi.fn(),
  outputError: vi.fn((message: string, code?: string) => {
    throw new Error(`${code ?? "UNKNOWN_ERROR"}: ${message}`);
  }),
  handleSdkError: vi.fn((error: unknown) => {
    throw error;
  }),
}));

describe("loginCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.stdin.isTTY = true;
    mocks.stdout.isTTY = true;

    mocks.agentList.mockResolvedValue([]);
    mocks.retellCtor.mockImplementation(function () {
      return {
        agent: {
          list: mocks.agentList,
        },
      };
    });

    vi.mocked(config.getConfigFilePath).mockImplementation(({ scope } = {}) =>
      scope === "local"
        ? "/repo/.voice-agent.json"
        : "/home/user/.config/voice-agent/config.json",
    );
    vi.mocked(config.configFileExists).mockReturnValue(false);
    vi.mocked(config.saveConfig).mockImplementation((_cfg, { scope } = {}) =>
      scope === "local"
        ? "/repo/.voice-agent.json"
        : "/home/user/.config/voice-agent/config.json",
    );
  });

  it("saves to global config by default", async () => {
    mocks.question.mockResolvedValueOnce("key_default");

    await loginCommand();

    expect(mocks.retellCtor).toHaveBeenCalledWith({ apiKey: "key_default" });
    expect(mocks.agentList).toHaveBeenCalledWith({ limit: 1 });
    expect(config.saveConfig).toHaveBeenCalledWith(
      { apiKey: "key_default", defaultFormat: "json" },
      { scope: "global" },
    );
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Successfully authenticated!",
        scope: "global",
        configPath: "/home/user/.config/voice-agent/config.json",
        nextSteps: [
          "Try from any directory: vac retell agents list",
          "Try from any directory: vac retell transcripts list",
        ],
      }),
    );
  });

  it("saves to local config when --local is provided", async () => {
    mocks.question.mockResolvedValueOnce("key_local");

    await loginCommand({ local: true });

    expect(config.saveConfig).toHaveBeenCalledWith(
      { apiKey: "key_local", defaultFormat: "json" },
      { scope: "local" },
    );
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "local",
        configPath: "/repo/.voice-agent.json",
        nextSteps: [
          "Try from this directory: vac retell agents list",
          "Use vac retell login --global for auth from any directory",
        ],
      }),
    );
  });

  it("rejects mutually exclusive --global and --local", async () => {
    await expect(loginCommand({ global: true, local: true })).rejects.toThrow(
      "INVALID_INPUT: Use only one of --global or --local",
    );

    expect(outputFormatter.outputError).toHaveBeenCalledWith(
      "Use only one of --global or --local",
      "INVALID_INPUT",
    );
    expect(mocks.question).not.toHaveBeenCalled();
    expect(config.saveConfig).not.toHaveBeenCalled();
  });

  it("returns structured guidance when no TTY is available", async () => {
    mocks.stdin.isTTY = false;

    await expect(loginCommand()).rejects.toThrow(
      "NON_INTERACTIVE: Interactive login requires a TTY",
    );

    expect(outputFormatter.outputError).toHaveBeenCalledWith(
      "Interactive login requires a TTY",
      "NON_INTERACTIVE",
      {
        retryable: false,
        nextSteps: [
          "Set RETELL_API_KEY for this process.",
          "Run a Retell command such as `vac retell agents list --limit 1`.",
        ],
      },
    );
    expect(mocks.question).not.toHaveBeenCalled();
    expect(config.saveConfig).not.toHaveBeenCalled();
  });

  it("prompts before overwriting the selected target config", async () => {
    vi.mocked(config.configFileExists).mockReturnValue(true);
    mocks.question.mockResolvedValueOnce("n");

    await loginCommand({ local: true });

    expect(mocks.question).toHaveBeenCalledWith(
      "local config already exists at /repo/.voice-agent.json. Overwrite? (y/n): ",
    );
    expect(outputFormatter.outputSuccess).toHaveBeenCalledWith({
      message: "Login cancelled",
    });
    expect(config.saveConfig).not.toHaveBeenCalled();
  });

  it("rejects an empty API key through the shared error response", async () => {
    mocks.question.mockResolvedValueOnce(" ");

    await expect(loginCommand()).rejects.toThrow(
      "INVALID_INPUT: API key cannot be empty",
    );

    expect(outputFormatter.outputError).toHaveBeenCalledWith(
      "API key cannot be empty",
      "INVALID_INPUT",
    );
    expect(config.saveConfig).not.toHaveBeenCalled();
  });
});
