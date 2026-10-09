import type { Command } from "commander";
import {
  associateCredentialCommand,
  listCredentialsCommand,
  removeCredentialCommand,
} from "./credentials";
import {
  associateIpAccessControlListCommand,
  listIpAccessControlListsCommand,
  removeIpAccessControlListCommand,
} from "./ip-access-control-lists";

export function registerTrunkAccessCommands(trunks: Command): void {
  const credentials = trunks
    .command("credentials")
    .description("Manage credential list associations");

  credentials
    .command("list <trunk_sid>")
    .description("List credential lists associated with a trunk")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: sid, friendly_name

Examples:
  $ vac twilio trunks credentials list TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
    )
    .action(async (trunkSid, options) => {
      await listCredentialsCommand(trunkSid, options);
    });

  credentials
    .command("associate <trunk_sid>")
    .description("Associate an existing credential list")
    .requiredOption("--credential-list <sid>", "CL SID of an existing list")
    .option("--dry-run", "Show before and after without associating the list")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks credentials associate TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      --credential-list CLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --dry-run
`,
    )
    .action(async (trunkSid, options) => {
      await associateCredentialCommand(trunkSid, options);
    });

  credentials
    .command("remove <trunk_sid> <credential_list_sid>")
    .description("Remove a credential list association")
    .option("--dry-run", "Show before and after without removing the list")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks credentials remove TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      CLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --dry-run
`,
    )
    .action(async (trunkSid, credentialListSid, options) => {
      await removeCredentialCommand(trunkSid, credentialListSid, options);
    });

  const ipAccessControlLists = trunks
    .command("ip-access-control-lists")
    .description("Manage IP access control list associations");

  ipAccessControlLists
    .command("list <trunk_sid>")
    .description("List IP access control lists and their addresses")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: sid, friendly_name, addresses

Examples:
  $ vac twilio trunks ip-access-control-lists list TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
    )
    .action(async (trunkSid, options) => {
      await listIpAccessControlListsCommand(trunkSid, options);
    });

  ipAccessControlLists
    .command("associate <trunk_sid>")
    .description("Associate an existing IP access control list")
    .requiredOption(
      "--ip-access-control-list <sid>",
      "AL SID of an existing list",
    )
    .option("--dry-run", "Show before and after without associating the list")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks ip-access-control-lists associate TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      --ip-access-control-list ALXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --dry-run
`,
    )
    .action(async (trunkSid, options) => {
      await associateIpAccessControlListCommand(trunkSid, options);
    });

  ipAccessControlLists
    .command("remove <trunk_sid> <ip_access_control_list_sid>")
    .description("Remove an IP access control list association")
    .option("--dry-run", "Show before and after without removing the list")
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio trunks ip-access-control-lists remove TKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \\
      ALXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --dry-run
`,
    )
    .action(async (trunkSid, listSid, options) => {
      await removeIpAccessControlListCommand(trunkSid, listSid, options);
    });
}
