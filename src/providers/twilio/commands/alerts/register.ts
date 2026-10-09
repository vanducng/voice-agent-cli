import type { Command } from "commander";
import { getAlertCommand } from "./get";
import { listAlertsCommand } from "./list";

const fields =
  "sid, error_code, log_level, resource_sid, request_url, date_generated, alert_text, more_info";

export function registerAlertCommands(program: Command): void {
  const alerts = program
    .command("alerts")
    .description("Inspect Monitor alerts");

  alerts
    .command("list")
    .description("List Monitor alerts")
    .option("--log-level <level>", "error, warning, notice, or debug")
    .option("--start-after <time>", "UTC ISO-8601 lower bound")
    .option("--end-before <time>", "UTC ISO-8601 upper bound")
    .option("--limit <n>", "Page size, from 1 to 1000")
    .option("--pagination-key <key>", "PageToken from the previous page")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

List results omit alert_text and more_info. Request variables and response bodies are never printed.

Examples:
  $ vac twilio alerts list --log-level error --limit 20 --fields sid,error_code,resource_sid
`,
    )
    .action(async (options) => {
      await listAlertsCommand(options);
    });

  alerts
    .command("get <alert_sid>")
    .description("Get one Monitor alert")
    .option("--fields <fields>", "Comma-separated fields to return")
    .addHelpText(
      "after",
      `
Fields: ${fields}

Examples:
  $ vac twilio alerts get NOXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --fields sid,error_code,alert_text
`,
    )
    .action(async (alertSid, options) => {
      await getAlertCommand(alertSid, options);
    });
}
