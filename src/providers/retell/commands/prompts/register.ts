import type { Command } from "commander";
import { pullPromptsCommand } from "./pull";
import { updatePromptsCommand } from "./update";
import { diffPromptsCommand } from "./diff";

export function registerPromptsCommands(program: Command): void {
  const prompts = program
    .command("prompts")
    .description("Manage agent prompts");

  prompts
    .command("pull <agent_id>")
    .description("Download agent prompts to a local directory")
    .option(
      "-o, --output <path>",
      "Output directory (default: .voice-agent/retell/prompts)",
      ".voice-agent/retell/prompts",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell prompts pull agent_123abc
  $ vac retell prompts pull agent_123abc --output ./my-prompts
  `,
    )
    .action(async (agentId, options) => {
      await pullPromptsCommand(agentId, options);
    });

  prompts
    .command("diff <agent_id>")
    .description("Show differences between local and remote prompts")
    .option(
      "-s, --source <path>",
      "Source directory path (default: .voice-agent/retell/prompts)",
      ".voice-agent/retell/prompts",
    )
    .option("-f, --fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell prompts diff agent_123abc
  $ vac retell prompts diff agent_123abc --source ./custom-prompts
  $ vac retell prompts diff agent_123abc --fields has_changes,changes.general_prompt
  `,
    )
    .action(async (agentId, options) => {
      await diffPromptsCommand(agentId, options);
    });

  prompts
    .command("update <agent_id>")
    .description("Update agent prompts from a local directory")
    .option(
      "-s, --source <path>",
      "Source directory path (default: .voice-agent/retell/prompts)",
      ".voice-agent/retell/prompts",
    )
    .option("--dry-run", "Preview changes without applying them", false)
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell prompts update agent_123abc --source ./my-prompts --dry-run
  $ vac retell prompts update agent_123abc --source ./my-prompts
  # Remember to publish: vac retell agents publish agent_123abc
  `,
    )
    .action(async (agentId, options) => {
      await updatePromptsCommand(agentId, options);
    });
}
