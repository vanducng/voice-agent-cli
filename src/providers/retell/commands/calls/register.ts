import type { Command } from "commander";
import { createPhoneCallCommand } from "./create-phone";
import { createWebCallCommand } from "./create-web";
import { registerPhoneCallCommand } from "./register-phone";
import { updateCallCommand } from "./update";
import { updateLiveCallCommand } from "./update-live";
import { deleteCallCommand } from "./delete";
import { stopCallCommand } from "./stop";

export function registerCallsCommands(program: Command): void {
  const calls = program
    .command("calls")
    .description("Create and manage calls (list/get are under `transcripts`)");

  calls
    .command("create-phone")
    .description("Create a new outbound phone call")
    .requiredOption("--from-number <number>", "Caller number in E.164 format")
    .requiredOption("--to-number <number>", "Callee number in E.164 format")
    .option("--override-agent-id <id>", "One-time agent override for this call")
    .option(
      "--override-agent-version <n>",
      "Override agent version for this call",
    )
    .option("--metadata <json>", "Inline JSON or @path for call metadata")
    .option(
      "--dynamic-variables <json>",
      "Inline JSON or @path for dynamic variables",
    )
    .option(
      "--custom-sip-headers <json>",
      "Inline JSON or @path for custom SIP headers",
    )
    .option(
      "--agent-override <path>",
      "Path to JSON file with agent_override block",
    )
    .option(
      "--ignore-e164-validation",
      "Skip E.164 validation for from-number (custom telephony)",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell calls create-phone --from-number +14157774444 --to-number +12137774445
  $ vac retell calls create-phone --from-number +1 --to-number +1 --metadata '{"customer_id":"c_1"}'
    `,
    )
    .action(async (options) => {
      await createPhoneCallCommand(options);
    });

  calls
    .command("create-web")
    .description("Create a new web call for a browser-based agent")
    .requiredOption("--agent-id <id>", "Agent to use for this web call")
    .option("--agent-version <n>", "Specific agent version")
    .option("--metadata <json>", "Inline JSON or @path for call metadata")
    .option(
      "--dynamic-variables <json>",
      "Inline JSON or @path for dynamic variables",
    )
    .option(
      "--agent-override <path>",
      "Path to JSON file with agent_override block",
    )
    .option("--current-node-id <id>", "Start at this conversation-flow node")
    .option("--current-state <name>", "Start at this Retell-LLM state")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await createWebCallCommand(options);
    });

  calls
    .command("register-phone")
    .description("Register a phone call for custom telephony (you dial)")
    .requiredOption("--agent-id <id>", "Agent to use for this call")
    .option("--agent-version <n>", "Specific agent version")
    .option("--direction <dir>", "inbound or outbound")
    .option("--from-number <n>", "Tracking from-number")
    .option("--to-number <n>", "Tracking to-number")
    .option("--metadata <json>", "Inline JSON or @path for call metadata")
    .option(
      "--dynamic-variables <json>",
      "Inline JSON or @path for dynamic variables",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await registerPhoneCallCommand(options);
    });

  calls
    .command("update <call_id>")
    .description("Update metadata and storage settings on an existing call")
    .option("--metadata <json>", "Inline JSON or @path for call metadata")
    .option(
      "--custom-attributes <json>",
      "Inline JSON or @path for custom attributes",
    )
    .option(
      "--data-storage-setting <value>",
      "everything | everything_except_pii | basic_attributes_only",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (callId, options) => {
      await updateCallCommand(callId, options);
    });

  calls
    .command("update-live <call_id>")
    .description("Update settings on an ongoing call")
    .requiredOption(
      "--dynamic-variables <json>",
      "Inline JSON or @path overriding dynamic variables",
    )
    .action(async (callId, options) => {
      await updateLiveCallCommand(callId, options);
    });

  calls
    .command("stop <call_id>")
    .description("Stop an ongoing call")
    .action(async (callId) => {
      await stopCallCommand(callId);
    });

  calls
    .command("delete <call_id>")
    .description("Delete a call and its associated data")
    .action(async (callId) => {
      await deleteCallCommand(callId);
    });
}
