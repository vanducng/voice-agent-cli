import type { Command } from "commander";
import { listFlowsCommand } from "./list";
import { getFlowCommand } from "./get";
import { createFlowCommand } from "./create";
import { updateFlowCommand } from "./update";
import { deleteFlowCommand } from "./delete";
import { parseFlagOrExit } from "../register-flags";
import { outputError } from "../../services/output-formatter";

export function registerFlowsCommands(program: Command): void {
  const flows = program
    .command("flows")
    .description("Manage conversation flow response engines");

  flows
    .command("list")
    .description("List all conversation flows")
    .option(
      "-l, --limit <number>",
      "Maximum number of flows to return (default: 100, max: 1000)",
      "100",
    )
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--sort-order <order>", "ascending or descending")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell flows list
  $ vac retell flows list --limit 50
  $ vac retell flows list --limit 50 --pagination-key next --sort-order ascending
  $ vac retell flows list --fields conversation_flow_id,version,start_speaker
  `,
    )
    .action(async (options) => {
      const limit = parseFlagOrExit(options.limit, "--limit") ?? 50;
      if (limit < 1 || limit > 1000) {
        outputError(
          "--limit must be a positive number between 1 and 1000",
          "VALIDATION_ERROR",
        );
      }
      await listFlowsCommand({
        limit,
        paginationKey: options.paginationKey,
        sortOrder: options.sortOrder,
        fields: options.fields,
      });
    });

  flows
    .command("get <conversation_flow_id>")
    .description("Get a specific conversation flow")
    .option(
      "--engine-version <number>",
      "Specific version to retrieve (defaults to latest)",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell flows get cf_abc123
  $ vac retell flows get cf_abc123 --engine-version 2
  $ vac retell flows get cf_abc123 --fields conversation_flow_id,nodes,edges
  `,
    )
    .action(async (conversationFlowId, options) => {
      await getFlowCommand(conversationFlowId, {
        version: parseFlagOrExit(options.engineVersion, "--engine-version"),
        fields: options.fields,
      });
    });

  flows
    .command("create")
    .description("Create a new conversation flow from a JSON file")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing flow configuration",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell flows create --file flow.json

Flow JSON format (minimal):
  {
    "start_speaker": "agent",
    "start_node_id": "node_1",
    "nodes": [...],
    "edges": [...]
  }
  `,
    )
    .action(async (options) => {
      await createFlowCommand({
        file: options.file,
      });
    });

  flows
    .command("update <conversation_flow_id>")
    .description("Update an existing conversation flow from a JSON file")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing flow updates",
    )
    .option(
      "--engine-version <number>",
      "Specific version to update (defaults to latest)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell flows update cf_abc123 --file updates.json
  $ vac retell flows update cf_abc123 --file updates.json --engine-version 2
  `,
    )
    .action(async (conversationFlowId, options) => {
      await updateFlowCommand(conversationFlowId, {
        file: options.file,
        version: parseFlagOrExit(options.engineVersion, "--engine-version"),
      });
    });

  flows
    .command("delete <conversation_flow_id>")
    .description("Delete a conversation flow")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell flows delete cf_abc123
  `,
    )
    .action(async (conversationFlowId) => {
      await deleteFlowCommand(conversationFlowId);
    });
}
