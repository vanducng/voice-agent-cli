import { reportCliError, ReportedCliError } from "../../../core/cli-response";
import { getTwilioCredentials, ConfigError } from "./config";

export class CliFailure extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly nextSteps: readonly [string, ...string[]],
  ) {
    super(message);
    this.name = "CliFailure";
  }
}

export function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as { status?: number }).status === 404
  );
}

export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function knownSecrets(): string[] {
  try {
    const credentials = getTwilioCredentials();
    return [
      credentials.accountSid,
      credentials.authToken,
      credentials.apiKey,
      credentials.apiSecret,
    ].filter((value): value is string => Boolean(value && value.length >= 8));
  } catch {
    return [];
  }
}

export function redactSecrets(
  message: string,
  secrets: readonly string[] = knownSecrets(),
): string {
  let redacted = message;
  for (const secret of secrets) {
    redacted = redacted.split(secret).join("[REDACTED]");
  }
  redacted = redacted
    .replace(
      /((?:api[_-]?key|api[_-]?secret|auth[_-]?token|authorization|token|secret|password)["']?\s*[:=]\s*(?:Basic\s+|Bearer\s+)?["']?)[^"',;\s}]+/gi,
      "$1[REDACTED]",
    )
    .replace(/\b(?:AC|SK)[0-9a-fA-F]{32}\b/g, "[REDACTED]")
    .replace(/\/\/[^/\s:@]+:[^/\s@]+@/g, "//[REDACTED]@");
  return redacted.length <= 500 ? redacted : `${redacted.slice(0, 497)}...`;
}

function restStatus(error: unknown): number | undefined {
  if (!(error instanceof Error) || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function guidance(
  code: string,
  mutating: boolean,
): { retryable: boolean; nextSteps: readonly [string, ...string[]] } {
  if (
    mutating &&
    [
      "RATE_LIMIT",
      "SERVER_ERROR",
      "CONNECTION_ERROR",
      "TIMEOUT_ERROR",
    ].includes(code)
  ) {
    return {
      retryable: false,
      nextSteps: [
        "Read the resource again and compare it with the requested change.",
        "Retry the write only after that read shows the change is still absent.",
      ],
    };
  }

  switch (code) {
    case "AUTH_ERROR":
    case "NO_CONFIG":
    case "CONFLICTING_CREDENTIALS":
      return {
        retryable: false,
        nextSteps: [
          "Set TWILIO_ACCOUNT_SID with TWILIO_AUTH_TOKEN, or TWILIO_ACCOUNT_SID with TWILIO_API_KEY and TWILIO_API_SECRET.",
          "Environment variables override saved login. Unset them to use `vac twilio login`.",
          "Run `vac twilio numbers list --limit 1` to verify authentication.",
        ],
      };
    case "INVALID_CONFIG":
    case "INVALID_JSON":
      return {
        retryable: false,
        nextSteps: [
          "Fix or remove the reported config file, then retry.",
          "Run `vac twilio login` to create a valid Twilio config.",
        ],
      };
    case "NON_INTERACTIVE":
      return {
        retryable: false,
        nextSteps: [
          "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for this process.",
          "Or set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET.",
        ],
      };
    case "RATE_LIMIT":
      return {
        retryable: true,
        nextSteps: ["Wait before retrying the same read."],
      };
    case "SERVER_ERROR":
    case "CONNECTION_ERROR":
    case "TIMEOUT_ERROR":
      return {
        retryable: true,
        nextSteps: [
          "Check Twilio service and network availability, then retry the same read.",
        ],
      };
    case "NOT_FOUND":
      return {
        retryable: false,
        nextSteps: ["Verify the SID or E.164 number, then retry the read."],
      };
    case "PERMISSION_DENIED":
      return {
        retryable: false,
        nextSteps: [
          "Verify the Twilio credential can read this resource, then retry.",
        ],
      };
    case "RECONCILIATION_FAILED":
      return {
        retryable: false,
        nextSteps: [
          "Read the resource again before another write.",
          "Do not retry the write until the read shows whether it landed.",
        ],
      };
    default:
      return {
        retryable: false,
        nextSteps: [
          "Run `vac twilio --help` to inspect valid commands and arguments.",
        ],
      };
  }
}

export function handleTwilioError(
  error: unknown,
  options: { mutating?: boolean } = {},
): never {
  if (error instanceof ReportedCliError) throw error;

  if (error instanceof CliFailure) {
    reportCliError({
      code: error.code,
      message: redactSecrets(error.message),
      retryable: error.retryable,
      nextSteps: error.nextSteps,
    });
    throw new ReportedCliError();
  }

  if (error instanceof ConfigError) {
    const defaults = guidance(error.code, false);
    reportCliError({
      code: error.code,
      message: redactSecrets(error.message),
      retryable: defaults.retryable,
      nextSteps: defaults.nextSteps,
    });
    throw new ReportedCliError();
  }

  const status = restStatus(error);
  const networkCode =
    error instanceof Error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  let code = "UNKNOWN_ERROR";
  if (status === 401) code = "AUTH_ERROR";
  else if (status === 403) code = "PERMISSION_DENIED";
  else if (status === 404) code = "NOT_FOUND";
  else if (status === 400) code = "BAD_REQUEST";
  else if (status === 429) code = "RATE_LIMIT";
  else if (status !== undefined && status >= 500) code = "SERVER_ERROR";
  else if (networkCode === "ETIMEDOUT" || networkCode === "ECONNABORTED")
    code = "TIMEOUT_ERROR";
  else if (
    ["ECONNRESET", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"].includes(
      networkCode,
    )
  ) {
    code = "CONNECTION_ERROR";
  } else if (error instanceof Error && error.name === "ValidationError") {
    code = "VALIDATION_ERROR";
  }

  const defaults = guidance(code, options.mutating === true);
  const detail =
    error instanceof Error && error.message
      ? redactSecrets(error.message)
      : "The Twilio request failed.";
  reportCliError({
    code,
    message: detail,
    retryable: defaults.retryable,
    nextSteps: defaults.nextSteps,
  });
  throw new ReportedCliError();
}
