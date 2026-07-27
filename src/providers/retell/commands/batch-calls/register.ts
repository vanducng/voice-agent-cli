import type { Command } from "commander";
import { createBatchCallCommand } from "./create";

export function registerBatchCallsCommands(program: Command): void {
  const batchCalls = program
    .command("batch-calls")
    .description("Schedule bulk outbound calls");

  batchCalls
    .command("create")
    .description("Create a new batch call")
    .requiredOption("--from-number <number>", "Caller number in E.164 format")
    .requiredOption(
      "--tasks <path>",
      "Path to JSON array of task objects ({to_number, ...})",
    )
    .option("--name <name>", "Friendly name for your reference")
    .option(
      "--reserved-concurrency <n>",
      "Concurrency reserved for non-batch calls",
    )
    .option("--trigger-timestamp <ms>", "Scheduled send time (unix ms)")
    .option(
      "--call-time-window <path>",
      "Path to JSON file with call_time_window object",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell batch-calls create --from-number +14157774444 --tasks tasks.json
  $ vac retell batch-calls create --from-number +1 --tasks tasks.json --name "Outreach Apr"
    `,
    )
    .action(async (options) => {
      await createBatchCallCommand(options);
    });
}
