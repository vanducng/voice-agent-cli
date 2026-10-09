import type { Command } from "commander";
import { getServiceCommand } from "./get";
import { listServicesCommand } from "./list";

const fields =
  "sid, friendly_name, usecase, inbound_request_url, status_callback, phone_numbers";

export function registerMessagingServiceCommands(program: Command): void {
  const services = program
    .command("messaging-services")
    .description("Inspect Messaging Services and sender pools");

  services
    .command("list")
    .description("List Messaging Services")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio messaging-services list --limit 20 --fields sid,friendly_name
`,
    )
    .action(async (options) => {
      await listServicesCommand(options);
    });

  services
    .command("get <service_sid>")
    .description("Get one Messaging Service and its phone numbers")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio messaging-services get MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`,
    )
    .action(async (serviceSid, options) => {
      await getServiceCommand(serviceSid, options);
    });
}
