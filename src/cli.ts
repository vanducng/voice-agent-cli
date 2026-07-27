import { Command, CommanderError } from "commander";
import { readFileSync } from "fs";
import { join } from "path";
import { registerUpgradeCommand } from "./commands/upgrade";
import { reportCliError, ReportedCliError } from "./core/cli-response";
import { registerRetellCommands } from "./providers/retell/register";

const { version } = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8"),
) as { version: string };

export function createProgram(): Command {
  const program = new Command()
    .name("vac")
    .description("Manage voice agents across providers")
    .version(version, "-v, --version", "Display version number")
    .helpOption("-h, --help", "Display help for command");

  registerUpgradeCommand(program, version);
  registerRetellCommands(program);
  return program;
}

function configureParsing(command: Command): void {
  command.exitOverride();
  command.configureOutput({
    writeErr: () => undefined,
    outputError: () => undefined,
  });
  command.commands.forEach(configureParsing);
}

function helpCommand(program: Command, argv: readonly string[]): string {
  const path = [program.name()];
  let command = program;

  for (const token of argv.slice(2)) {
    const child = command.commands.find(
      (candidate) =>
        candidate.name() === token || candidate.aliases().includes(token),
    );
    if (!child) break;
    command = child;
    path.push(command.name());
  }

  return `${path.join(" ")} --help`;
}

function usageMessage(code: string): string {
  switch (code) {
    case "commander.unknownCommand":
      return "Unknown command.";
    case "commander.unknownOption":
      return "Unknown option.";
    case "commander.missingArgument":
      return "A required argument is missing.";
    case "commander.optionMissingArgument":
      return "An option value is missing.";
    case "commander.missingMandatoryOptionValue":
      return "A required option is missing.";
    case "commander.conflictingOption":
      return "Conflicting options were provided.";
    default:
      return "Invalid command usage.";
  }
}

export async function run(
  argv: readonly string[] = process.argv,
): Promise<void> {
  const program = createProgram();

  if (argv.length <= 2) {
    program.outputHelp();
    return;
  }

  configureParsing(program);

  try {
    await program.parseAsync([...argv]);
  } catch (error) {
    if (error instanceof ReportedCliError) {
      return;
    }
    if (!(error instanceof CommanderError)) {
      throw error;
    }
    if (error.exitCode === 0) {
      return;
    }

    reportCliError({
      code: "CLI_USAGE_ERROR",
      message: usageMessage(error.code),
      retryable: false,
      nextSteps: [
        `Run \`${helpCommand(program, argv)}\` to list valid options and arguments.`,
      ],
    });
  }
}
