import type { Command } from "commander";
import { listPhoneNumbersCommand } from "./list";
import { getPhoneNumberCommand } from "./get";
import { importPhoneNumberCommand } from "./import";
import { createPhoneNumberCommand } from "./create";
import { updatePhoneNumberCommand } from "./update";
import { deletePhoneNumberCommand } from "./delete";

export function registerPhoneNumbersCommands(program: Command): void {
  const phoneNumbers = program
    .command("phone-numbers")
    .description("Manage phone numbers");

  phoneNumbers
    .command("list")
    .description("List all phone numbers")
    .option("--limit <n>", "Maximum number of phone numbers to return")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--sort-order <order>", "ascending or descending")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell phone-numbers list
  $ vac retell phone-numbers list --limit 25 --sort-order descending
  $ vac retell phone-numbers list --fields phone_number,nickname,inbound_agents
  `,
    )
    .action(async (options) => {
      await listPhoneNumbersCommand(options);
    });

  phoneNumbers
    .command("get <phone_number>")
    .description("Get phone number details")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell phone-numbers get +14157774444
  $ vac retell phone-numbers get +14157774444 --fields phone_number,inbound_agents
  `,
    )
    .action(async (phoneNumber, options) => {
      await getPhoneNumberCommand(phoneNumber, options);
    });

  phoneNumbers
    .command("import")
    .description("Import a phone number from custom telephony")
    .requiredOption("--number <number>", "Phone number in E.164 format")
    .requiredOption("--termination-uri <uri>", "SIP trunk termination URI")
    .option("--nickname <name>", "Friendly name for reference")
    .option(
      "--inbound-agent <id>",
      "Single agent for inbound calls (shorthand for weight 1)",
    )
    .option(
      "--outbound-agent <id>",
      "Single agent for outbound calls (shorthand for weight 1)",
    )
    .option(
      "--inbound-agents <spec>",
      "Weighted inbound agents (format: id:weight,id:weight)",
    )
    .option(
      "--outbound-agents <spec>",
      "Weighted outbound agents (format: id:weight,id:weight)",
    )
    .option("--sip-username <user>", "SIP trunk auth username")
    .option("--sip-password <pass>", "SIP trunk auth password")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell phone-numbers import --number +14157774444 --termination-uri someuri.pstn.twilio.com
  $ vac retell phone-numbers import --number +14157774444 --termination-uri someuri.pstn.twilio.com --nickname "Support Line"
  $ vac retell phone-numbers import --number +14157774444 --termination-uri someuri.pstn.twilio.com --inbound-agent agent_xxx
  $ vac retell phone-numbers import --number +14157774444 --termination-uri someuri.pstn.twilio.com --inbound-agents "agent_1:0.6,agent_2:0.4"

SMS agent bindings are not supported on import. Use \`phone-numbers update\` after import to bind SMS agents.
  `,
    )
    .action(async (options) => {
      await importPhoneNumberCommand(options);
    });

  phoneNumbers
    .command("create")
    .description("Purchase a new phone number and bind agents")
    .option("--country-code <code>", "Country code: US or CA")
    .option("--area-code <code>", "3-digit US area code")
    .option("--number-provider <provider>", "twilio or telnyx")
    .option("--toll-free", "Purchase a toll-free number")
    .option("--nickname <name>", "Friendly name for reference")
    .option("--phone-number <number>", "Specific E.164 number to purchase")
    .option(
      "--fallback-number <number>",
      "Enterprise: fallback destination during outage",
    )
    .option("--inbound-webhook-url <url>", "Inbound call webhook URL")
    .option("--transport <proto>", "SIP transport: TLS, TCP, or UDP")
    .option(
      "--inbound-agent <id>",
      "Single inbound agent (shorthand for weight 1)",
    )
    .option(
      "--outbound-agent <id>",
      "Single outbound agent (shorthand for weight 1)",
    )
    .option(
      "--inbound-agents <spec>",
      "Weighted inbound agents (format: id:weight,id:weight)",
    )
    .option(
      "--outbound-agents <spec>",
      "Weighted outbound agents (format: id:weight,id:weight)",
    )
    .option(
      "--allowed-inbound-country-list <csv>",
      "Comma-separated ISO-2 country codes",
    )
    .option(
      "--allowed-outbound-country-list <csv>",
      "Comma-separated ISO-2 country codes",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell phone-numbers create --area-code 415 --nickname "Frontdesk"
  $ vac retell phone-numbers create --country-code US --toll-free --inbound-agent agent_xxx
    `,
    )
    .action(async (options) => {
      await createPhoneNumberCommand(options);
    });

  phoneNumbers
    .command("update <phone_number>")
    .description("Update agents and settings bound to a phone number")
    .option(
      "--nickname <name>",
      "Friendly name for reference (use empty string to clear)",
    )
    .option(
      "--termination-uri <uri>",
      "SIP trunk termination URI (custom telephony)",
    )
    .option("--sip-username <user>", "SIP trunk auth username")
    .option("--sip-password <pass>", "SIP trunk auth password")
    .option(
      "--transport <proto>",
      "SIP transport: TLS, TCP, or UDP (use empty string to clear)",
    )
    .option(
      "--inbound-webhook-url <url>",
      "Inbound call webhook URL (use empty string to clear)",
    )
    .option(
      "--inbound-sms-webhook-url <url>",
      "Inbound SMS webhook URL (use empty string to clear)",
    )
    .option(
      "--fallback-number <number>",
      "Enterprise: fallback destination during outage (use empty string to clear)",
    )
    .option(
      "--allowed-inbound-country-list <csv>",
      "Comma-separated ISO-2 country codes (use empty string to clear)",
    )
    .option(
      "--allowed-outbound-country-list <csv>",
      "Comma-separated ISO-2 country codes (use empty string to clear)",
    )
    .option(
      "--inbound-agent <id>",
      "Single inbound agent (shorthand for weight 1)",
    )
    .option(
      "--inbound-agent-version <version-or-tag>",
      "Numeric version or environment tag for --inbound-agent",
    )
    .option(
      "--outbound-agent <id>",
      "Single outbound agent (shorthand for weight 1)",
    )
    .option(
      "--outbound-agent-version <version-or-tag>",
      "Numeric version or environment tag for --outbound-agent",
    )
    .option(
      "--inbound-agents <spec>",
      "Weighted inbound agents (format: id:weight,id:weight)",
    )
    .option(
      "--outbound-agents <spec>",
      "Weighted outbound agents (format: id:weight,id:weight)",
    )
    .option("--inbound-sms-agents <spec>", "Weighted inbound SMS agents")
    .option("--outbound-sms-agents <spec>", "Weighted outbound SMS agents")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell phone-numbers update +14157774444 --inbound-agent agent_new
  $ vac retell phone-numbers update +14157774444 --inbound-agent agent_new --inbound-agent-version prod
  $ vac retell phone-numbers update +14157774444 --inbound-agents "a:0.7,b:0.3" --nickname Support
  $ vac retell phone-numbers update +14157774444 --fallback-number "" (clear)
    `,
    )
    .action(async (phoneNumber, options) => {
      await updatePhoneNumberCommand(phoneNumber, options);
    });

  phoneNumbers
    .command("delete <phone_number>")
    .description("Release an existing phone number")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell phone-numbers delete +14157774444
    `,
    )
    .action(async (phoneNumber) => {
      await deletePhoneNumberCommand(phoneNumber);
    });
}
