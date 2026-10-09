import type { Command } from "commander";
import { getRecordingCommand } from "./get";
import { listRecordingsCommand } from "./list";

const fields =
  "sid, call_sid, status, duration, channels, source, start_time, error_code";

export function registerRecordingCommands(program: Command): void {
  const recordings = program
    .command("recordings")
    .description("Inspect call recording metadata");

  recordings
    .command("list")
    .description("List recording metadata")
    .option("--call <call_sid>", "Only recordings for this call")
    .option("--created-after <time>", "UTC ISO-8601 lower bound")
    .option("--created-before <time>", "UTC ISO-8601 upper bound")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Media URLs are not returned.

Examples:
  $ vac twilio recordings list --call CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --limit 20
`,
    )
    .action(async (options) => {
      await listRecordingsCommand(options);
    });

  recordings
    .command("get <recording_sid>")
    .description("Get one recording's metadata")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio recordings get REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
    )
    .action(async (recordingSid, options) => {
      await getRecordingCommand(recordingSid, options);
    });
}
