import type { Command } from "commander";
import { listToolsCommand } from "./list";
import { getToolCommand } from "./get";
import { addToolCommand } from "./add";
import { updateToolCommand } from "./update";
import { removeToolCommand } from "./remove";
import { exportToolsCommand } from "./export";
import { importToolsCommand } from "./import";

export function registerToolsCommands(program: Command): void {
  const tools = program
    .command("tools")
    .description("Manage agent tools (custom functions, webhooks, etc.)");

  tools
    .command("list <agent_id>")
    .description("List all tools configured for an agent")
    .option("--state <name>", "Filter by state name (Retell LLM only)")
    .option(
      "--component <id>",
      "Filter by component ID (Conversation Flow only)",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools list agent_123abc
  $ vac retell tools list agent_123abc --state greeting
  $ vac retell tools list agent_123abc --fields total_count,general_tools
  `,
    )
    .action(async (agentId, options) => {
      await listToolsCommand(agentId, {
        state: options.state,
        component: options.component,
        fields: options.fields,
      });
    });

  tools
    .command("get <agent_id> <tool_name>")
    .description("Get detailed information about a specific tool")
    .option("--state <name>", "State name to search within (Retell LLM only)")
    .option(
      "--component <id>",
      "Component ID to search within (Conversation Flow only)",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools get agent_123abc lookup_customer
  $ vac retell tools get agent_123abc book_cal --state booking
  $ vac retell tools get agent_123abc my_tool --fields tool.name,tool.type
  `,
    )
    .action(async (agentId, toolName, options) => {
      await getToolCommand(agentId, toolName, {
        state: options.state,
        component: options.component,
        fields: options.fields,
      });
    });

  tools
    .command("add <agent_id>")
    .description("Add a new tool to an agent")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing tool definition",
    )
    .option("--state <name>", "Add to specific state (Retell LLM only)")
    .option(
      "--component <id>",
      "Add to specific component (Conversation Flow only)",
    )
    .option("--dry-run", "Preview changes without applying them")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools add agent_123abc --file tool.json
  $ vac retell tools add agent_123abc --file tool.json --state booking
  $ vac retell tools add agent_123abc --file tool.json --dry-run
  `,
    )
    .action(async (agentId, options) => {
      await addToolCommand(agentId, {
        file: options.file,
        state: options.state,
        component: options.component,
        dryRun: options.dryRun,
      });
    });

  tools
    .command("update <agent_id> <tool_name>")
    .description("Update an existing tool")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing updated tool definition",
    )
    .option("--state <name>", "State where tool exists (Retell LLM only)")
    .option(
      "--component <id>",
      "Component where tool exists (Conversation Flow only)",
    )
    .option("--dry-run", "Preview changes without applying them")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools update agent_123abc lookup_customer --file tool.json
  $ vac retell tools update agent_123abc book_cal --file tool.json --state booking
  $ vac retell tools update agent_123abc my_tool --file tool.json --dry-run
  `,
    )
    .action(async (agentId, toolName, options) => {
      await updateToolCommand(agentId, toolName, {
        file: options.file,
        state: options.state,
        component: options.component,
        dryRun: options.dryRun,
      });
    });

  tools
    .command("remove <agent_id> <tool_name>")
    .description("Remove a tool from an agent")
    .option("--state <name>", "State where tool exists (Retell LLM only)")
    .option(
      "--component <id>",
      "Component where tool exists (Conversation Flow only)",
    )
    .option("--dry-run", "Preview changes without applying them")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools remove agent_123abc lookup_customer
  $ vac retell tools remove agent_123abc book_cal --state booking
  $ vac retell tools remove agent_123abc my_tool --dry-run
  `,
    )
    .action(async (agentId, toolName, options) => {
      await removeToolCommand(agentId, toolName, {
        state: options.state,
        component: options.component,
        dryRun: options.dryRun,
      });
    });

  tools
    .command("export <agent_id>")
    .description("Export all tools from an agent to a JSON file")
    .option(
      "-o, --output <path>",
      "Output file path (prints to stdout if not specified)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools export agent_123abc
  $ vac retell tools export agent_123abc --output tools.json
  $ vac retell tools export agent_123abc > tools.json
  `,
    )
    .action(async (agentId, options) => {
      await exportToolsCommand(agentId, {
        output: options.output,
      });
    });

  tools
    .command("import <agent_id>")
    .description("Import tools from a JSON file to an agent")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing tools to import",
    )
    .option("--dry-run", "Preview changes without applying them")
    .option(
      "--replace",
      "Replace existing tools with same name instead of skipping",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tools import agent_123abc --file tools.json
  $ vac retell tools import agent_123abc --file tools.json --dry-run
  $ vac retell tools import agent_123abc --file tools.json --replace
  `,
    )
    .action(async (agentId, options) => {
      await importToolsCommand(agentId, {
        file: options.file,
        dryRun: options.dryRun,
        replace: options.replace,
      });
    });
}
