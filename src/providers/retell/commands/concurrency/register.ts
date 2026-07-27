import type { Command } from "commander";
import { getConcurrencyCommand } from "./get";

export function registerConcurrencyCommands(program: Command): void {
  const concurrency = program
    .command("concurrency")
    .description("View the org's call concurrency and limits");

  concurrency
    .command("get")
    .description("Get current call concurrency and limits")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await getConcurrencyCommand(options);
    });
}
