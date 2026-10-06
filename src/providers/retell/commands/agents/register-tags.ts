import type { Command } from "commander";
import { assignAgentTagCommand, getAgentTagsCommand } from "./tags";

export function registerAgentTagCommands(agents: Command): void {
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
    .description(
      "Assign an existing tag to a version or update its dynamic variables",
    )
    .option(
      "--agent-version <n>",
      "Agent version to assign; omit to keep the current version",
    )
    .option(
      "--dynamic-variables <json>",
      "JSON object of string dynamic variables to merge into the tag",
    )
    .option(
      "--dynamic-variables-file <path>",
      "JSON file of string dynamic variables to merge into the tag",
    )
    .option(
      "--set <key=value>",
      "Set one dynamic variable (repeatable; overrides the same key from JSON)",
      (value: string, previous: string[]) => previous.concat(value),
      [] as string[],
    )
    .option(
      "--replace",
      "Replace the selected tag's dynamic variables instead of merging",
    )
    .option("--dry-run", "Preview the change without updating the tag")
    .action(async (agentId, tag, options) => {
      await assignAgentTagCommand(agentId, tag, options);
    });
}
