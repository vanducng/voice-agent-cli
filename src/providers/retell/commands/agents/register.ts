import type { Command } from "commander";
import { listAgentsCommand } from "./list";
import { agentInfoCommand } from "./info";
import { createAgentCommand } from "./create";
import { deleteAgentCommand } from "./delete";
import { agentVersionsCommand } from "./versions";
import { createAgentVersionCommand } from "./create-version";
import { deleteAgentVersionCommand } from "./delete-version";
import { publishAgentCommand } from "../agent/publish";
import { agentMcpToolsCommand } from "./mcp-tools";
import { assignAgentTagCommand, getAgentTagsCommand } from "./tags";
import { parseFlagOrExit } from "../register-flags";
import { outputError } from "../../services/output-formatter";

export function registerAgentsCommands(program: Command): void {
  const agents = program.command("agents").description("Manage agents");

  agents
    .command("list")
    .description("List all agents")
    .option(
      "-l, --limit <number>",
      "Maximum number of agents to return (default: 100)",
      "100",
    )
    .option(
      "--pagination-key <key>",
      "Pagination key for fetching the next page",
    )
    .option(
      "--fields <fields>",
      "Comma-separated list of fields to return (e.g., agent_id,agent_name,channel,tags,user_modified_timestamp)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agents list
  $ vac retell agents list --limit 10
  $ vac retell agents list --fields agent_id,agent_name
  $ vac retell agents list | jq '.items[] | {agent_id,agent_name}'
  `,
    )
    .action(async (options) => {
      const limit = parseFlagOrExit(options.limit, "--limit") ?? 50;
      if (limit < 1) {
        outputError("--limit must be a positive number", "VALIDATION_ERROR");
      }
      await listAgentsCommand({
        limit,
        paginationKey: options.paginationKey,
        fields: options.fields,
      });
    });

  agents
    .command("info <agent_id>")
    .description("Get detailed agent information")
    .option(
      "--fields <fields>",
      "Comma-separated list of fields to return (e.g., agent_name,response_engine.type,voice_config)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agents info agent_123abc
  $ vac retell agents info agent_123abc --fields agent_name,response_engine.type
  $ vac retell agents info agent_123abc | jq '.response_engine.type'
  `,
    )
    .action(async (agentId, options) => {
      await agentInfoCommand(agentId, {
        fields: options.fields,
      });
    });

  agents
    .command("create")
    .description("Create a new agent")
    .requiredOption("--voice <voice_id>", "Voice ID for the agent")
    .option("--name <name>", "Agent name")
    .option(
      "--llm-id <id>",
      "Retell LLM ID (creates retell-llm response engine)",
    )
    .option(
      "--flow-id <id>",
      "Conversation Flow ID (creates conversation-flow response engine)",
    )
    .option("--custom-llm <url>", "Custom LLM WebSocket URL")
    .option(
      "-f, --file <path>",
      "Full agent config from JSON file (overrides other options)",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agents create --voice 11labs-Adrian --llm-id llm_xxx --name "Test Agent"
  $ vac retell agents create --voice 11labs-Adrian --flow-id cf_xxx
  $ vac retell agents create --file agent-config.json
  `,
    )
    .action(async (options) => {
      await createAgentCommand(options);
    });

  agents
    .command("delete <agent_id>")
    .description("Delete an agent")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agents delete agent_123abc
  `,
    )
    .action(async (agentId) => {
      await deleteAgentCommand(agentId);
    });

  agents
    .command("versions <agent_id>")
    .description("List all versions of an agent")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agents versions agent_123abc
  $ vac retell agents versions agent_123abc --fields version,is_published
  `,
    )
    .action(async (agentId, options) => {
      await agentVersionsCommand(agentId, options);
    });

  agents
    .command("create-version <agent_id>")
    .description("Create a draft agent version from a base version")
    .requiredOption("--base-version <n>", "Existing version to copy")
    .action(async (agentId, options) => {
      await createAgentVersionCommand(agentId, options);
    });

  agents
    .command("delete-version <agent_id>")
    .description("Delete a specific agent version")
    .requiredOption("--version <n>", "Version to delete")
    .action(async (agentId, options) => {
      await deleteAgentVersionCommand(agentId, options);
    });

  agents
    .command("publish <agent_id>")
    .description("Publish a draft agent version")
    .option("--version <n>", "Draft version to publish")
    .option("--description <text>", "Version description")
    .action(async (agentId, options) => {
      await publishAgentCommand(agentId, options);
    });

  agents
    .command("mcp-tools <agent_id>")
    .description("List the MCP tools available to an agent")
    .requiredOption("--mcp-id <id>", "ID of the MCP server")
    .option("--component-id <id>", "Component id (if MCP is under a component)")
    .option("--version <n>", "Agent version (defaults to latest)")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (agentId, options) => {
      await agentMcpToolsCommand(agentId, options);
    });

  const tags = agents
    .command("tags")
    .description("Inspect and assign agent environment tags");

  tags
    .command("get <agent_id> [tag]")
    .description("Get all tags or one tag on an agent")
    .action(async (agentId, tag) => {
      await getAgentTagsCommand(agentId, tag);
    });

  tags
    .command("assign <agent_id> <tag>")
    .description("Assign an existing tag to an agent version")
    .requiredOption("--agent-version <n>", "Agent version to assign")
    .option("--dry-run", "Preview the assignment without changing the tag")
    .action(async (agentId, tag, options) => {
      await assignAgentTagCommand(agentId, tag, options);
    });
}
