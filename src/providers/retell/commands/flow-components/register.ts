import type { Command } from "commander";
import { listFlowComponentsCommand } from "./list";
import { getFlowComponentCommand } from "./get";
import { createFlowComponentCommand } from "./create";
import { updateFlowComponentCommand } from "./update";
import { deleteFlowComponentCommand } from "./delete";

export function registerFlowComponentsCommands(program: Command): void {
  const flowComponents = program
    .command("flow-components")
    .description("Manage reusable conversation-flow components");

  flowComponents
    .command("list")
    .description("List flow components")
    .option("--limit <n>", "Maximum number of flow components to return")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--sort-order <order>", "ascending or descending")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await listFlowComponentsCommand(options);
    });

  flowComponents
    .command("get <component_id>")
    .description("Get a flow component")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (componentId, options) => {
      await getFlowComponentCommand(componentId, options);
    });

  flowComponents
    .command("create")
    .description("Create a new flow component (body via --file)")
    .requiredOption("-f, --file <path>", "Path to JSON file with the full body")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await createFlowComponentCommand(options);
    });

  flowComponents
    .command("update <component_id>")
    .description("Update a flow component (body via --file)")
    .requiredOption("-f, --file <path>", "Path to JSON file with update body")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (componentId, options) => {
      await updateFlowComponentCommand(componentId, options);
    });

  flowComponents
    .command("delete <component_id>")
    .description("Delete a flow component")
    .action(async (componentId) => {
      await deleteFlowComponentCommand(componentId);
    });
}
