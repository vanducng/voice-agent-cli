import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportedCliError } from "../../../core/cli-response";
import { loginCommand } from "./login";

const mocks = vi.hoisted(() => ({
  question: vi.fn(),
  stdin: { isTTY: true },
  stdout: { isTTY: true, write: vi.fn() },
  configFileExists: vi.fn(),
  saveTwilioConfig: vi.fn(),
  envPresent: false,
}));

vi.mock("node:process", () => ({
  stdin: mocks.stdin,
  stdout: mocks.stdout,
}));

vi.mock("node:readline/promises", () => ({
  createInterface: vi.fn(() => ({
    question: mocks.question,
    close: vi.fn(),
  })),
}));

vi.mock("../services/config", async () => {
  const actual =
    await vi.importActual<typeof import("../services/config")>(
      "../services/config",
    );
  return {
    ...actual,
    getConfigFilePath: ({ scope }: { scope?: string } = {}) =>
      scope === "local"
        ? "/repo/.voice-agent.json"
        : "/home/config/voice-agent/config.json",
    configFileExists: () => mocks.configFileExists(),
    saveTwilioConfig: (...args: unknown[]) => mocks.saveTwilioConfig(...args),
    twilioEnvPresent: () => mocks.envPresent,
    getTwilioCredentials: () => {
      throw new actual.ConfigError(
        "No Twilio configuration found.",
        "NO_CONFIG",
      );
    },
  };
});

vi.mock("../services/client", async () => {
  const actual =
    await vi.importActual<typeof import("../services/client")>(
      "../services/client",
    );
  const fixture = await import("../testing/http");
  return {
    ...actual,
    createTwilioClient: (
      credentials: Parameters<typeof actual.createTwilioClient>[0],
    ) =>
      actual.createTwilioClient(credentials, {
        httpClient: fixture.http().httpClient,
      }),
  };
});

const ACCOUNT = `AC${"1".repeat(32)}`;
const TOKEN = "auth-token-value-not-real";
const API_KEY = `SK${"b".repeat(32)}`;
const API_SECRET = "api-secret-value-not-real";

describe("twilio login", () => {
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const { installHttp } = await import("../testing/http");
    installHttp();
    vi.clearAllMocks();
    mocks.stdin.isTTY = true;
    mocks.stdout.isTTY = true;
    mocks.envPresent = false;
    mocks.configFileExists.mockReturnValue(false);
    mocks.saveTwilioConfig.mockImplementation(
      (_config, options?: { scope?: string }) =>
        options?.scope === "local"
          ? "/repo/.voice-agent.json"
          : "/home/config/voice-agent/config.json",
    );
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("saves an auth token after the account fetch succeeds", async () => {
    mocks.question.mockResolvedValueOnce(ACCOUNT).mockResolvedValueOnce(TOKEN);

    await loginCommand();

    const { http } = await import("../testing/http");
    expect(http().requests[0]).toMatchObject({
      method: "get",
      username: ACCOUNT,
      password: TOKEN,
    });
    expect(mocks.saveTwilioConfig).toHaveBeenCalledWith(
      { accountSid: ACCOUNT, authToken: TOKEN, defaultFormat: "json" },
      { scope: "global" },
    );
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      ok: true,
      scope: "global",
      auth: "auth_token",
      configPath: "/home/config/voice-agent/config.json",
    });
    expect(String(log.mock.calls)).not.toContain(TOKEN);
  });

  it("saves an API key when the auth token prompt is empty", async () => {
    mocks.question
      .mockResolvedValueOnce(ACCOUNT)
      .mockResolvedValueOnce(" ")
      .mockResolvedValueOnce(API_KEY)
      .mockResolvedValueOnce(API_SECRET);

    await loginCommand({ local: true });

    const { http } = await import("../testing/http");
    expect(http().requests[0]).toMatchObject({
      username: API_KEY,
      password: API_SECRET,
    });
    expect(mocks.saveTwilioConfig).toHaveBeenCalledWith(
      {
        accountSid: ACCOUNT,
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        defaultFormat: "json",
      },
      { scope: "local" },
    );
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({
      auth: "api_key",
      scope: "local",
    });
    expect(String(log.mock.calls) + String(error.mock.calls)).not.toContain(
      API_SECRET,
    );
  });

  it("tells the operator to unset env vars when they override the saved file", async () => {
    mocks.envPresent = true;
    mocks.question.mockResolvedValueOnce(ACCOUNT).mockResolvedValueOnce(TOKEN);

    await loginCommand();

    expect(JSON.parse(String(log.mock.calls[0]?.[0])).nextSteps[0]).toContain(
      "Unset TWILIO_ACCOUNT_SID",
    );
  });

  it("rejects a non-interactive shell and conflicting scope flags", async () => {
    mocks.stdin.isTTY = false;
    await expect(loginCommand()).rejects.toBeInstanceOf(ReportedCliError);
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      error: { code: "NON_INTERACTIVE", retryable: false },
    });

    mocks.stdin.isTTY = true;
    await expect(
      loginCommand({ global: true, local: true }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(JSON.parse(String(error.mock.calls.at(-1)?.[0]))).toMatchObject({
      error: { code: "INVALID_INPUT" },
    });
    expect(mocks.question).not.toHaveBeenCalled();
  });

  it("cancels when the operator declines an overwrite", async () => {
    mocks.configFileExists.mockReturnValue(true);
    mocks.question.mockResolvedValueOnce("n");

    await loginCommand({ local: true });

    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toEqual({
      ok: true,
      message: "Login cancelled",
    });
    expect(mocks.saveTwilioConfig).not.toHaveBeenCalled();
  });

  it("does not save or echo an invalid account SID", async () => {
    mocks.question
      .mockResolvedValueOnce("not-a-sid")
      .mockResolvedValueOnce(TOKEN);

    await expect(loginCommand()).rejects.toBeInstanceOf(ReportedCliError);

    const body = String(error.mock.calls[0]?.[0]);
    expect(body).not.toContain(TOKEN);
    expect(body).not.toContain("not-a-sid");
    expect(JSON.parse(body)).toMatchObject({
      error: { code: "INVALID_CONFIG" },
    });
    expect(mocks.saveTwilioConfig).not.toHaveBeenCalled();
  });
});
