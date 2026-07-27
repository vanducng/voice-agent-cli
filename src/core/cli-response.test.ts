import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCliError,
  reportCliError,
  reportUnexpectedError,
} from "./cli-response";

afterEach(() => {
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe("CLI error responses", () => {
  it("serializes a stable actionable envelope", () => {
    expect(
      createCliError({
        code: "CLI_USAGE_ERROR",
        message: "Invalid command usage.",
        retryable: false,
        nextSteps: ["Run `vac --help` to list valid commands."],
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "CLI_USAGE_ERROR",
        message: "Invalid command usage.",
        retryable: false,
        next_steps: ["Run `vac --help` to list valid commands."],
      },
    });
  });

  it("keeps next steps non-empty", () => {
    expect(
      createCliError({
        code: "TEST_ERROR",
        message: "Test failure.",
        retryable: false,
        nextSteps: [] as unknown as [string, ...string[]],
      }).error.next_steps,
    ).toEqual(["Run `vac --help` to list valid commands."]);
  });

  it("writes one JSON object and sets a failing exit code", () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    reportCliError({
      code: "TEST_ERROR",
      message: "Test failure.",
      retryable: true,
      nextSteps: ["Retry the command."],
    });

    expect(error).toHaveBeenCalledOnce();
    expect(JSON.parse(String(error.mock.calls[0][0]))).toMatchObject({
      ok: false,
      error: { code: "TEST_ERROR", retryable: true },
    });
    expect(process.exitCode).toBe(1);
  });

  it("reports unexpected failures without leaking supplied details", () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const secret = "secret-marker";

    reportUnexpectedError(new Error(secret));

    const output = String(error.mock.calls[0][0]);
    expect(JSON.parse(output)).toMatchObject({
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        retryable: false,
      },
    });
    expect(output).not.toContain(secret);
    expect(output).not.toContain("Error:");
  });
});
