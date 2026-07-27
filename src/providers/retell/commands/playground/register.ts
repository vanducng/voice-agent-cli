import type { Command } from "commander";
import { playgroundCompleteCommand } from "./complete";

export function registerPlaygroundCommands(program: Command): void {
  const playground = program
    .command("playground")
    .description("Run stateless playground completions");

  playground
    .command("complete <agent_id>")
    .description("Run a stateless playground completion")
    .requiredOption(
      "--messages <json>",
      "Conversation history as inline JSON array or @path",
    )
    .option(
      "--dynamic-variables <json>",
      "Inline JSON object or @path for dynamic variables",
    )
    .option("--tool-mocks <json>", "Inline JSON array or @path for tool mocks")
    .option("--current-state <name>", "Current Retell-LLM state")
    .option("--current-node-id <id>", "Current conversation-flow node id")
    .option("--component-id <id>", "Conversation-flow component id")
    .option("--version <number>", "Agent version to use")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell playground complete agent_abc --messages '[{"role":"user","content":"Hi"}]'
  $ vac retell playground complete agent_abc --messages @messages.json --dynamic-variables '{"name":"Ada"}'
    `,
    )
    .action(async (agentId, options) => {
      await playgroundCompleteCommand(agentId, options);
    });
}
