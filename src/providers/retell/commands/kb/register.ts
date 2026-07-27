import type { Command } from "commander";
import { listKnowledgeBasesCommand } from "./list";
import { getKnowledgeBaseCommand } from "./get";
import { createKnowledgeBaseCommand } from "./create";
import { deleteKnowledgeBaseCommand } from "./delete";
import { addKnowledgeBaseSourcesCommand } from "./sources/add";
import { deleteKnowledgeBaseSourceCommand } from "./sources/delete";

export function registerKbCommands(program: Command): void {
  const kb = program.command("kb").description("Manage RAG knowledge bases");

  kb.command("list")
    .description("List all knowledge bases")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell kb list
  $ vac retell kb list --fields knowledge_base_id,knowledge_base_name,status
  `,
    )
    .action(async (options) => {
      await listKnowledgeBasesCommand({
        fields: options.fields,
      });
    });

  kb.command("get <knowledge_base_id>")
    .description("Get a specific knowledge base")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell kb get kb_abc123
  $ vac retell kb get kb_abc123 --fields knowledge_base_name,status,knowledge_base_sources
  `,
    )
    .action(async (knowledgeBaseId, options) => {
      await getKnowledgeBaseCommand(knowledgeBaseId, {
        fields: options.fields,
      });
    });

  kb.command("create")
    .description("Create a new knowledge base")
    .requiredOption(
      "-n, --name <name>",
      "Knowledge base name (max 40 characters)",
    )
    .option("--urls <urls>", "Comma-separated list of URLs to scrape")
    .option(
      "--texts <file>",
      "Path to JSON file with text entries [{ title, text }, ...]",
    )
    .option(
      "--auto-refresh",
      "Enable 12-hour automatic refresh for URL sources",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell kb create --name "Product Docs"
  $ vac retell kb create --name "Support KB" --urls https://docs.example.com,https://help.example.com
  $ vac retell kb create --name "FAQ" --texts texts.json
  $ vac retell kb create --name "Docs" --urls https://docs.example.com --auto-refresh

Text file format (texts.json):
  [
    { "title": "Getting Started", "text": "Welcome to our product..." },
    { "title": "FAQ", "text": "Frequently asked questions..." }
  ]
  `,
    )
    .action(async (options) => {
      await createKnowledgeBaseCommand({
        name: options.name,
        urls: options.urls,
        texts: options.texts,
        autoRefresh: options.autoRefresh,
      });
    });

  kb.command("delete <knowledge_base_id>")
    .description("Delete a knowledge base")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell kb delete kb_abc123
  `,
    )
    .action(async (knowledgeBaseId) => {
      await deleteKnowledgeBaseCommand(knowledgeBaseId);
    });

  const kbSources = kb
    .command("sources")
    .description("Manage knowledge base sources");

  kbSources
    .command("add <knowledge_base_id>")
    .description("Add sources to an existing knowledge base")
    .option("--urls <urls>", "Comma-separated list of URLs to scrape")
    .option(
      "--texts <file>",
      "Path to JSON file with text entries [{ title, text }, ...]",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell kb sources add kb_abc123 --urls https://docs.example.com/new
  $ vac retell kb sources add kb_abc123 --texts additional-texts.json
  $ vac retell kb sources add kb_abc123 --urls https://faq.example.com --texts more-texts.json
  `,
    )
    .action(async (knowledgeBaseId, options) => {
      await addKnowledgeBaseSourcesCommand(knowledgeBaseId, {
        urls: options.urls,
        texts: options.texts,
      });
    });

  kbSources
    .command("delete <knowledge_base_id> <source_id>")
    .description("Remove a source from a knowledge base")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell kb sources delete kb_abc123 source_xyz789
  `,
    )
    .action(async (knowledgeBaseId, sourceId) => {
      await deleteKnowledgeBaseSourceCommand(knowledgeBaseId, sourceId);
    });
}
