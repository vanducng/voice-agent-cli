import type { Command } from "commander";
import { publishAgentCommand } from "../agent/publish";

export function registerAgentPublishCommands(program: Command): void {
  program
    .command("agent-publish <agent_id>")
    .description("Publish a draft agent to make changes live")
    .option("--version <n>", "Draft version to publish")
    .option("--description <text>", "Version description")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agents publish agent_123abc
  $ vac retell agents publish agent_123abc --version 15 --description "May prompt update"
  # Run this after updating prompts to make changes live
  `,
    )
    .action(async (agentId, options) => {
      await publishAgentCommand(agentId, options);
    });
}
