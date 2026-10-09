import type { Command } from "commander";
import { listCallEventsCommand } from "./events";
import { getCallCommand } from "./get";
import { listCallsCommand } from "./list";

const fields =
  "sid, from, to, status, direction, start_time, end_time, duration, trunk_sid, phone_number_sid, parent_call_sid, answered_by, queue_time";

export function registerCallCommands(program: Command): void {
  const calls = program.command("calls").description("Inspect voice calls");

  calls
    .command("list")
    .description("List calls")
    .option("--from <caller>", "Filter by the caller")
    .option("--to <callee>", "Filter by the callee")
    .option(
      "--status <status>",
      "queued, ringing, in-progress, canceled, completed, failed, busy, or no-answer",
    )
    .option("--start-after <time>", "UTC ISO-8601 start time lower bound")
    .option("--start-before <time>", "UTC ISO-8601 start time upper bound")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio calls list --start-after 2026-10-10T00:00:00Z --limit 20
  $ vac twilio calls list --from +15555550100 --status completed
`,
    )
    .action(async (options) => {
      await listCallsCommand(options);
    });

  calls
    .command("get <call_sid>")
    .description("Get one call")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio calls get CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
    )
    .action(async (callSid, options) => {
      await getCallCommand(callSid, options);
    });

  calls
    .command("events <call_sid>")
    .description("List redacted Programmable Voice request and response events")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: request, response

Examples:
  $ vac twilio calls events CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --limit 20
`,
    )
    .action(async (callSid, options) => {
      await listCallEventsCommand(callSid, options);
    });
}
