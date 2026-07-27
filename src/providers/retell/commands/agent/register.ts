import type { Command } from "commander";
import { getAgentCommand } from "./get";
import { updateAgentCommand } from "./update";
import { parseFlagOrExit } from "../register-flags";

export function registerAgentCommands(program: Command): void {
  const agent = program
    .command("agent")
    .description(
      "Manage agent-level configuration (voice, webhooks, post-call analysis, etc.)",
    );

  agent
    .command("get <agent_id>")
    .description("Get agent configuration")
    .option(
      "--engine-version <number>",
      "Specific version to retrieve (defaults to latest)",
    )
    .option(
      "--fields <fields>",
      "Comma-separated list of fields to return (e.g., agent_name,post_call_analysis_data)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agent get agent_123abc
  $ vac retell agent get agent_123abc --engine-version 2
  $ vac retell agent get agent_123abc --fields agent_name,post_call_analysis_data
  $ vac retell agent get agent_123abc > config.json
  `,
    )
    .action(async (agentId, options) => {
      await getAgentCommand(agentId, {
        version: parseFlagOrExit(options.engineVersion, "--engine-version"),
        fields: options.fields,
      });
    });

  agent
    .command("update <agent_id>")
    .description("Update agent configuration from a JSON file")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing agent configuration updates",
    )
    .option("--dry-run", "Preview changes without applying them")
    .option(
      "--engine-version <number>",
      "Specific version to update (defaults to latest draft)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell agent update agent_123abc --file config.json
  $ vac retell agent update agent_123abc --file config.json --dry-run
  $ vac retell agent update agent_123abc --file analysis.json --engine-version 2

Example JSON for post-call analysis:
  {
    "post_call_analysis_model": "claude-4.5-sonnet",
    "post_call_analysis_data": [
      {
        "type": "system-presets",
        "name": "call_summary",
        "description": "Summarize the call outcome in 2 sentences."
      },
      {
        "type": "system-presets",
        "name": "call_successful",
        "description": "Determine if the issue was resolved."
      },
      {
        "name": "call_outcome",
        "type": "enum",
        "description": "Result of the call",
        "choices": ["successful", "unsuccessful", "callback_needed"]
      }
    ]
  }

Note: Run 'vac retell agents publish <agent_id>' after updating to publish changes.
  `,
    )
    .action(async (agentId, options) => {
      await updateAgentCommand(agentId, {
        file: options.file,
        dryRun: options.dryRun,
        version: parseFlagOrExit(options.engineVersion, "--engine-version"),
      });
    });
}
