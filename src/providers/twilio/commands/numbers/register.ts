import type { Command } from "commander";
import { getNumberCommand } from "./get";
import { listNumbersCommand } from "./list";
import { updateNumberCommand } from "./update";

const fields =
  "sid, phone_number, friendly_name, trunk_sid, voice_url, voice_method, voice_application_sid, sms_url, status_callback";

export function registerNumberCommands(program: Command): void {
  const numbers = program
    .command("numbers")
    .description("Manage incoming phone numbers");

  numbers
    .command("list")
    .description("List incoming phone numbers")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio numbers list --limit 20 --fields sid,phone_number,trunk_sid
  $ vac twilio numbers list --pagination-key <token>
`,
    )
    .action(async (options) => {
      await listNumbersCommand(options);
    });

  numbers
    .command("get <number>")
    .description("Get one incoming number by PN SID or E.164")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio numbers get PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  $ vac twilio numbers get +15555550100 --fields sid,trunk_sid,voice_url
`,
    )
    .action(async (number, options) => {
      await getNumberCommand(number, options);
    });

  numbers
    .command("update <number>")
    .description("Attach, move, or detach a number's Elastic SIP trunk")
    .requiredOption("--trunk <sid>", "Trunk SID, or none to detach")
    .option("--dry-run", "Show before and after without sending the update")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio numbers update +15555550100 --trunk TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --dry-run
  $ vac twilio numbers update PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --trunk none --dry-run
`,
    )
    .action(async (number, options) => {
      await updateNumberCommand(number, options);
    });
}
