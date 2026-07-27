import type { Command } from "commander";
import { createChatCommand } from "./create";
import { getChatCommand } from "./get";
import { listChatsCommand } from "./list";
import { updateChatCommand } from "./update";
import { chatCompleteCommand } from "./complete";
import { createSmsChatCommand } from "./sms";
import { endChatCommand } from "./end";
import { deleteChatCommand } from "./delete";
import { rerunChatAnalysisCommand } from "./rerun-analysis";

export function registerChatsCommands(program: Command): void {
  const chats = program
    .command("chats")
    .description("Manage chat sessions with chat agents");

  chats
    .command("create")
    .description("Start a new chat session")
    .requiredOption("--agent-id <id>", "Chat agent id")
    .option("--agent-version <n>", "Specific chat agent version")
    .option("--metadata <json>", "Inline JSON or @path for chat metadata")
    .option(
      "--dynamic-variables <json>",
      "Inline JSON or @path for dynamic variables",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await createChatCommand(options);
    });

  chats
    .command("get <chat_id>")
    .description("Get a chat by id")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (chatId, options) => {
      await getChatCommand(chatId, options);
    });

  chats
    .command("list")
    .description("List chats")
    .option("-l, --limit <n>", "Maximum number to return")
    .option("--pagination-key <key>", "Opaque cursor from the previous page")
    .option("--sort-order <order>", "ascending or descending")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await listChatsCommand(options);
    });

  chats
    .command("update <chat_id>")
    .description("Update metadata and storage settings on a chat")
    .option("--metadata <json>", "Inline JSON or @path for chat metadata")
    .option(
      "--custom-attributes <json>",
      "Inline JSON or @path for custom attributes",
    )
    .option(
      "--dynamic-variables <json>",
      "Inline JSON or @path overriding dynamic variables",
    )
    .option(
      "--data-storage-setting <value>",
      "everything | basic_attributes_only",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (chatId, options) => {
      await updateChatCommand(chatId, options);
    });

  chats
    .command("complete")
    .description("Send a user message and get the agent's completion")
    .requiredOption("--chat-id <id>", "Chat id")
    .requiredOption("--content <text>", "User message content")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await chatCompleteCommand(options);
    });

  chats
    .command("sms")
    .description("Create an SMS-backed chat session")
    .requiredOption(
      "--from-number <number>",
      "Sender number (must be SMS-capable)",
    )
    .requiredOption("--to-number <number>", "Recipient number")
    .option("--override-agent-id <id>", "One-time agent override")
    .option("--override-agent-version <n>", "Override agent version")
    .option("--metadata <json>", "Inline JSON or @path for chat metadata")
    .option(
      "--dynamic-variables <json>",
      "Inline JSON or @path for dynamic variables",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await createSmsChatCommand(options);
    });

  chats
    .command("end <chat_id>")
    .description("End an active chat session")
    .action(async (chatId) => {
      await endChatCommand(chatId);
    });

  chats
    .command("rerun-analysis <chat_id>")
    .description("Rerun post-chat analysis for a completed chat")
    .action(async (chatId) => {
      await rerunChatAnalysisCommand(chatId);
    });

  chats
    .command("delete <chat_id>")
    .description("Delete a chat and its associated data")
    .action(async (chatId) => {
      await deleteChatCommand(chatId);
    });
}
