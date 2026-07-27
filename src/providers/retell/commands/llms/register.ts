import type { Command } from "commander";
import { listLlmsCommand } from "./list";
import { getLlmCommand } from "./get";
import { createLlmCommand } from "./create";
import { updateLlmCommand } from "./update";
import { deleteLlmCommand } from "./delete";

export function registerLlmsCommands(program: Command): void {
  const llms = program
    .command("llms")
    .description("Manage Retell LLM response engines");

  llms
    .command("list")
    .description("List Retell LLMs")
    .option("-l, --limit <n>", "Maximum number to return")
    .option("--pagination-key <key>", "Opaque cursor from the previous page")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await listLlmsCommand(options);
    });

  llms
    .command("get <llm_id>")
    .description("Get a specific Retell LLM")
    .option(
      "--version <n>",
      "Specific version to retrieve (defaults to latest)",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (llmId, options) => {
      await getLlmCommand(llmId, options);
    });

  llms
    .command("create")
    .description("Create a new Retell LLM (simple flags or full --file)")
    .option("-f, --file <path>", "Path to JSON file with the full LLM body")
    .option("--general-prompt <text>", "General system prompt")
    .option("--model <model>", "Text LLM model (e.g. gpt-4.1)")
    .option("--s2s-model <model>", "Speech-to-speech model")
    .option("--start-speaker <who>", "'user' or 'agent'")
    .option("--begin-message <msg>", "First agent utterance")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await createLlmCommand(options);
    });

  llms
    .command("update <llm_id>")
    .description("Update a Retell LLM (body via --file)")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file with LLM update body",
    )
    .option("--version <n>", "Specific version to update")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (llmId, options) => {
      await updateLlmCommand(llmId, options);
    });

  llms
    .command("delete <llm_id>")
    .description("Delete a Retell LLM")
    .action(async (llmId) => {
      await deleteLlmCommand(llmId);
    });
}
