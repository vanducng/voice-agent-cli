import type { Command } from "commander";
import { getTrunkCommand } from "./get";
import { listTrunksCommand } from "./list";
import { addOriginationCommand } from "./origination-add";
import { removeOriginationCommand } from "./origination-remove";

const fields =
  "sid, domain_name, friendly_name, secure, transfer_mode, transfer_caller_id, recording, origination_urls, phone_numbers";

export function registerTrunkCommands(program: Command): void {
  const trunks = program
    .command("trunks")
    .description("Manage Elastic SIP trunks");

  trunks
    .command("list")
    .description("List trunks with origination URLs and phone numbers")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio trunks list --limit 20
  $ vac twilio trunks list --fields sid,domain_name,origination_urls
`,
    )
    .action(async (options) => {
      await listTrunksCommand(options);
    });

  trunks
    .command("get <trunk_sid>")
    .description("Get one trunk, its origination URLs, and its phone numbers")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio trunks get TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
    )
    .action(async (trunkSid, options) => {
      await getTrunkCommand(trunkSid, options);
    });

  const origination = trunks
    .command("origination")
    .description("Manage origination URLs on a trunk");

  origination
    .command("add <trunk_sid>")
    .description("Add an origination URL")
    .requiredOption("--sip-url <url>", "sip: URI that receives inbound calls")
    .requiredOption(
      "--priority <n>",
      "Integer from 0 to 65535; lower is preferred",
    )
    .requiredOption("--weight <n>", "Integer from 1 to 65535")
    .option("--enabled <bool>", "true or false; defaults to true")
    .option("--friendly-name <name>", "Name up to 64 characters")
    .option("--dry-run", "Show before and after without creating the URL")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks origination add TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      --sip-url sip:example.pstn.example.com --priority 10 --weight 10 --dry-run
`,
    )
    .action(async (trunkSid, options) => {
      await addOriginationCommand(trunkSid, options);
    });

  origination
    .command("remove <trunk_sid> <origination_url_sid>")
    .description("Remove an origination URL")
    .option("--dry-run", "Show before and after without deleting the URL")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks origination remove TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX OUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --dry-run
`,
    )
    .action(async (trunkSid, originationUrlSid, options) => {
      await removeOriginationCommand(trunkSid, originationUrlSid, options);
    });
}
