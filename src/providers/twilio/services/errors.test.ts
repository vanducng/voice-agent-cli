import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportedCliError } from "../../../core/cli-response";
import { handleTwilioError, redactSecrets } from "./errors";

const ACCOUNT = `AC${"1".repeat(32)}`;
const TOKEN = "auth-token-value-not-real";
const API_KEY = `SK${"b".repeat(32)}`;

describe("twilio error redaction", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("redacts known secrets, SID-shaped values, and embedded credentials", () => {
    const message = redactSecrets(
      `auth_token=${TOKEN} ${ACCOUNT} ${API_KEY} https://${ACCOUNT}:${TOKEN}@api.example.com/hook`,
      [TOKEN],
    );

    expect(message).not.toContain(TOKEN);
    expect(message).not.toContain(ACCOUNT);
    expect(message).not.toContain(API_KEY);
    expect(message).toContain("[REDACTED]");
  });

  it("marks a mutating connection failure as not retryable", () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const failure = Object.assign(new Error(`reset ${TOKEN}`), {
      code: "ECONNRESET",
    });
    vi.stubEnv("TWILIO_ACCOUNT_SID", ACCOUNT);
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_API_KEY", "");
    vi.stubEnv("TWILIO_API_SECRET", "");

    expect(() => handleTwilioError(failure, { mutating: true })).toThrow(
      ReportedCliError,
    );

    const body = String(error.mock.calls[0]?.[0]);
    expect(body).not.toContain(TOKEN);
    expect(JSON.parse(body)).toMatchObject({
      ok: false,
      error: {
        code: "CONNECTION_ERROR",
        retryable: false,
        next_steps: expect.any(Array),
      },
    });
  });
});
