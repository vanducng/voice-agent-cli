import type { Command } from "commander";
import { registerLoginCommands } from "./commands/login/register";
import { registerTranscriptsCommands } from "./commands/transcripts/register";
import { registerAgentsCommands } from "./commands/agents/register";
import { registerPromptsCommands } from "./commands/prompts/register";
import { registerAgentPublishCommands } from "./commands/agent-publish/register";
import { registerAgentCommands } from "./commands/agent/register";
import { registerToolsCommands } from "./commands/tools/register";
import { registerTestsCommands } from "./commands/tests/register";
import { registerKbCommands } from "./commands/kb/register";
import { registerFlowsCommands } from "./commands/flows/register";
import { registerPhoneNumbersCommands } from "./commands/phone-numbers/register";
import { registerCallsCommands } from "./commands/calls/register";
import { registerExportsCommands } from "./commands/exports/register";
import { registerBatchCallsCommands } from "./commands/batch-calls/register";
import { registerLlmsCommands } from "./commands/llms/register";
import { registerVoicesCommands } from "./commands/voices/register";
import { registerChatsCommands } from "./commands/chats/register";
import { registerPlaygroundCommands } from "./commands/playground/register";
import { registerChatAgentsCommands } from "./commands/chat-agents/register";
import { registerFlowComponentsCommands } from "./commands/flow-components/register";
import { registerConcurrencyCommands } from "./commands/concurrency/register";

export function registerRetellCommands(root: Command): Command {
  const program = root
    .command("retell")
    .description("Manage Retell AI resources")
    .helpOption("-h, --help", "Display help for command")
    .option("--json", "Output as JSON (default)", true);

  registerLoginCommands(program);
  registerTranscriptsCommands(program);
  registerAgentsCommands(program);
  registerPromptsCommands(program);
  registerAgentPublishCommands(program);
  registerAgentCommands(program);
  registerToolsCommands(program);
  registerTestsCommands(program);
  registerKbCommands(program);
  registerFlowsCommands(program);
  registerPhoneNumbersCommands(program);
  registerCallsCommands(program);
  registerExportsCommands(program);
  registerBatchCallsCommands(program);
  registerLlmsCommands(program);
  registerVoicesCommands(program);
  registerChatsCommands(program);
  registerPlaygroundCommands(program);
  registerChatAgentsCommands(program);
  registerFlowComponentsCommands(program);
  registerConcurrencyCommands(program);

  return program;
}
