import type { Command } from "commander";
import { getTrunkCommand } from "./get";
import { listTrunksCommand } from "./list";
import { registerTrunkAccessCommands } from "./register-access";
import { addOriginationCommand } from "./origination-add";
import { removeOriginationCommand } from "./origination-remove";
import { updateOriginationCommand } from "./origination-update";
import { updateTrunkCommand } from "./update";

const fields =
  "sid, domain_name, friendly_name, secure, transfer_mode, transfer_caller_id, recording, auth_type, disaster_recovery_url, disaster_recovery_method, cnam_lookup_enabled, symmetric_rtp_enabled, origination_urls, phone_numbers";

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

  trunks
    .command("update <trunk_sid>")
    .description("Update trunk routing settings")
    .option("--disaster-recovery-url <url>", "http(s) URL, or none to clear")
    .option("--disaster-recovery-method <method>", "GET or POST")
    .option("--secure <bool>", "true or false")
    .option("--cnam-lookup-enabled <bool>", "true or false")
    .option("--transfer-mode <mode>", "disable-all, enable-all, or sip-only")
    .option("--transfer-caller-id <id>", "from-transferee or from-transferor")
    .option(
      "--recording-mode <mode>",
      "do-not-record, record-from-ringing, record-from-answer, record-from-ringing-dual, or record-from-answer-dual",
    )
    .option("--recording-trim <trim>", "do-not-trim or trim-silence")
    .option("--dry-run", "Show before and after without changing the trunk")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks update TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      --recording-mode record-from-ringing --dry-run
`,
    )
    .action(async (trunkSid, options) => {
      await updateTrunkCommand(trunkSid, options);
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
    .command("update <trunk_sid> <origination_url_sid>")
    .description("Update an origination URL")
    .option("--sip-url <url>", "sip: URI that receives inbound calls")
    .option("--priority <n>", "Integer from 0 to 65535; lower is preferred")
    .option("--weight <n>", "Integer from 1 to 65535")
    .option("--enabled <bool>", "true or false")
    .option("--friendly-name <name>", "Name up to 64 characters")
    .option("--dry-run", "Show before and after without changing the URL")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks origination update TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      OUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --enabled false --dry-run
`,
    )
    .action(async (trunkSid, originationUrlSid, options) => {
      await updateOriginationCommand(trunkSid, originationUrlSid, options);
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

  registerTrunkAccessCommands(trunks);
}
