import type { Command } from "commander";
import { getMessageCommand } from "./get";
import { listMessagesCommand } from "./list";

const fields =
  "sid, to, from, status, direction, error_code, error_message, messaging_service_sid, num_segments, date_sent, date_created, body";

export function registerMessageCommands(program: Command): void {
  const messages = program
    .command("messages")
    .description("Inspect SMS messages");

  messages
    .command("list")
    .description("List messages")
    .option("--to <e164>", "Filter by recipient")
    .option("--from <e164>", "Filter by sender")
    .option("--sent-after <time>", "UTC ISO-8601 sent time lower bound")
    .option("--sent-before <time>", "UTC ISO-8601 sent time upper bound")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("--include-body", "Include message text")
    .addHelpText(
      "after",
      `
Fields: ${fields}

The body is omitted unless --include-body is set.

Examples:
  $ vac twilio messages list --from +15555550100 --limit 20 --fields sid,status,error_code
`,
    )
    .action(async (options) => {
      await listMessagesCommand(options);
    });

  messages
    .command("get <message_sid>")
    .description("Get one message")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("--include-body", "Include message text")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio messages get SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --fields sid,status,error_code
`,
    )
    .action(async (messageSid, options) => {
      await getMessageCommand(messageSid, options);
    });
}
