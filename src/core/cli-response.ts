export interface CliErrorInput {
  code: string;
  message: string;
  retryable: boolean;
  nextSteps: readonly [string, ...string[]];
}

export class ReportedCliError extends Error {
  constructor() {
    super("CLI error already reported.");
    this.name = "ReportedCliError";
  }
}

export function createCliError(input: CliErrorInput) {
  const nextSteps = input.nextSteps.filter((step) => step.trim());

  return {
    ok: false as const,
    error: {
      code: input.code,
      message: input.message,
      retryable: input.retryable,
      next_steps:
        nextSteps.length > 0
          ? nextSteps
          : ["Run `vac --help` to list valid commands."],
    },
  };
}

export function reportCliError(input: CliErrorInput): void {
  console.error(JSON.stringify(createCliError(input), null, 2));
  process.exitCode = 1;
}

export function reportUnexpectedError(_error: unknown): void {
  reportCliError({
    code: "UNEXPECTED_ERROR",
    message: "An unexpected CLI failure occurred.",
    retryable: false,
    nextSteps: [
      "Retry with `vac --help` and a valid command.",
      "If the failure persists, report it at https://github.com/vanducng/voice-agent-cli/issues.",
    ],
  });
}
