import type { Command } from "commander";
import { createChatAgentCommand } from "./create";
import { getChatAgentCommand } from "./get";
import { updateChatAgentCommand } from "./update";
import { listChatAgentsCommand } from "./list";
import { deleteChatAgentCommand } from "./delete";
import { chatAgentVersionsCommand } from "./versions";
import { publishChatAgentCommand } from "./publish";
import { createChatAgentVersionCommand } from "./create-version";
import { deleteChatAgentVersionCommand } from "./delete-version";

export function registerChatAgentsCommands(program: Command): void {
  const chatAgents = program
    .command("chat-agents")
    .description("Manage chat agents (text/SMS mode)");

  chatAgents
    .command("list")
    .description("List chat agents")
    .option("-l, --limit <n>", "Maximum number to return")
    .option(
      "--pagination-key <key>",
      "Pagination key for fetching the next page",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await listChatAgentsCommand(options);
    });

  chatAgents
    .command("get <agent_id>")
    .description("Get a chat agent")
    .option("--version <n>", "Specific version to retrieve")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (agentId, options) => {
      await getChatAgentCommand(agentId, options);
    });

  chatAgents
    .command("create")
    .description("Create a new chat agent")
    .option("-f, --file <path>", "Path to JSON file with full agent body")
    .option("--name <name>", "Agent name")
    .option("--llm-id <id>", "Attach a retell-llm response engine")
    .option("--flow-id <id>", "Attach a conversation-flow response engine")
    .option("--custom-llm <url>", "Custom-LLM websocket URL")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await createChatAgentCommand(options);
    });

  chatAgents
    .command("update <agent_id>")
    .description("Update a chat agent (body via --file)")
    .requiredOption("-f, --file <path>", "Path to JSON file with update body")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (agentId, options) => {
      await updateChatAgentCommand(agentId, options);
    });

  chatAgents
    .command("delete <agent_id>")
    .description("Delete a chat agent")
    .action(async (agentId) => {
      await deleteChatAgentCommand(agentId);
    });

  chatAgents
    .command("versions <agent_id>")
    .description("List all versions of a chat agent")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (agentId, options) => {
      await chatAgentVersionsCommand(agentId, options);
    });

  chatAgents
    .command("create-version <agent_id>")
    .description("Create a draft chat agent version from a base version")
    .requiredOption("--base-version <n>", "Existing version to copy")
    .action(async (agentId, options) => {
      await createChatAgentVersionCommand(agentId, options);
    });

  chatAgents
    .command("delete-version <agent_id>")
    .description("Delete a specific chat agent version")
    .requiredOption("--version <n>", "Version to delete")
    .action(async (agentId, options) => {
      await deleteChatAgentVersionCommand(agentId, options);
    });

  chatAgents
    .command("publish <agent_id>")
    .description("Publish a draft chat agent version")
    .option("--version <n>", "Draft version to publish")
    .option("--description <text>", "Version description")
    .action(async (agentId, options) => {
      await publishChatAgentCommand(agentId, options);
    });
}
