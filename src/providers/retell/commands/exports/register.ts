import type { Command } from "commander";
import { listExportRequestsCommand } from "../export-requests/list";

export function registerExportsCommands(program: Command): void {
  const exportsCommand = program
    .command("exports")
    .description("Manage export requests");

  exportsCommand
    .command("list")
    .description("List export requests")
    .option("--limit <number>", "Maximum number of export requests to return")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--sort-order <order>", "ascending or descending")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell exports list
  $ vac retell exports list --limit 20 --sort-order descending
  $ vac retell exports list --fields items.0.export_request_id,pagination_key
    `,
    )
    .action(async (options) => {
      await listExportRequestsCommand(options);
    });
}
