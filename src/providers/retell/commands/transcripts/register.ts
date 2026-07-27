import type { Command } from "commander";
import { listTranscriptsCommand } from "./list";
import { getTranscriptCommand } from "./get";
import {
  analyzeTranscriptCommand,
  DEFAULT_LATENCY_THRESHOLD,
  DEFAULT_SILENCE_THRESHOLD,
} from "./analyze";
import { searchTranscriptsCommand } from "./search";
import { parseFlagOrExit } from "../register-flags";
import { outputError } from "../../services/output-formatter";

export function registerTranscriptsCommands(program: Command): void {
  const transcripts = program
    .command("transcripts")
    .description("Manage call transcripts");

  transcripts
    .command("list")
    .description("List all call transcripts")
    .option(
      "-l, --limit <number>",
      "Maximum number of calls to return (default: 50)",
      "50",
    )
    .option(
      "--fields <fields>",
      "Comma-separated list of fields to return (e.g., call_id,call_status,metadata.duration)",
    )
    .option("--pagination-key <key>", "Pagination key for the next page")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell transcripts list
  $ vac retell transcripts list --limit 100
  $ vac retell transcripts list --fields call_id,call_status
  $ vac retell transcripts list | jq '.items[] | select(.call_status == "error")'
  `,
    )
    .action(async (options) => {
      const limit = parseFlagOrExit(options.limit, "--limit") ?? 50;
      if (limit < 1) {
        outputError("--limit must be a positive number", "VALIDATION_ERROR");
      }
      await listTranscriptsCommand({
        limit,
        paginationKey: options.paginationKey,
        fields: options.fields,
      });
    });

  transcripts
    .command("get <call_id>")
    .description("Get a specific call transcript")
    .option(
      "--fields <fields>",
      "Comma-separated list of fields to return (e.g., call_id,metadata.duration,analysis)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell transcripts get call_abc123
  $ vac retell transcripts get call_abc123 --fields call_id,metadata.duration
  $ vac retell transcripts get call_abc123 | jq '.transcript_object'
  `,
    )
    .action(async (callId, options) => {
      await getTranscriptCommand(callId, {
        fields: options.fields,
      });
    });

  transcripts
    .command("analyze <call_id>")
    .description(
      "Analyze a call transcript with performance metrics and insights",
    )
    .option(
      "--fields <fields>",
      "Comma-separated list of fields to return (e.g., call_id,performance,analysis.summary)",
    )
    .option(
      "--raw",
      "Return unmodified API response instead of enriched analysis",
    )
    .option(
      "--hotspots-only",
      "Return only conversation hotspots/issues for troubleshooting",
    )
    .option(
      "--latency-threshold <ms>",
      `Latency threshold in ms for hotspot detection (default: ${DEFAULT_LATENCY_THRESHOLD})`,
      String(DEFAULT_LATENCY_THRESHOLD),
    )
    .option(
      "--silence-threshold <ms>",
      `Silence threshold in ms for hotspot detection (default: ${DEFAULT_SILENCE_THRESHOLD})`,
      String(DEFAULT_SILENCE_THRESHOLD),
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell transcripts analyze call_abc123
  $ vac retell transcripts analyze call_abc123 --fields call_id,performance
  $ vac retell transcripts analyze call_abc123 --raw
  $ vac retell transcripts analyze call_abc123 --raw --fields call_id,transcript_object
  $ vac retell transcripts analyze call_abc123 --hotspots-only
  $ vac retell transcripts analyze call_abc123 --hotspots-only --latency-threshold 1500
  $ vac retell transcripts analyze call_abc123 --hotspots-only --fields hotspots
  $ vac retell transcripts analyze call_abc123 | jq '.performance.latency_p50_ms'
  `,
    )
    .action(async (callId, options) => {
      await analyzeTranscriptCommand(callId, {
        fields: options.fields,
        raw: options.raw,
        hotspotsOnly: options.hotspotsOnly,
        latencyThreshold: parseFlagOrExit(
          options.latencyThreshold,
          "--latency-threshold",
        ),
        silenceThreshold: parseFlagOrExit(
          options.silenceThreshold,
          "--silence-threshold",
        ),
      });
    });

  transcripts
    .command("search")
    .description("Search transcripts with advanced filtering")
    .option(
      "--status <status>",
      "Filter by call status (error, ended, ongoing)",
    )
    .option("--agent-id <id>", "Filter by agent ID")
    .option(
      "--since <date>",
      "Filter calls after this date (YYYY-MM-DD or ISO format)",
    )
    .option(
      "--until <date>",
      "Filter calls before this date (YYYY-MM-DD or ISO format)",
    )
    .option("--limit <number>", "Maximum number of results (default: 50)", "50")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell transcripts search --status error
  $ vac retell transcripts search --agent-id agent_123 --since 2025-11-01
  $ vac retell transcripts search --status error --limit 10
  $ vac retell transcripts search --status error --fields call_id,agent_id,call_status
  $ vac retell transcripts search --since 2025-11-01 --until 2025-11-15
  `,
    )
    .action(async (options) => {
      await searchTranscriptsCommand({
        status: options.status,
        agentId: options.agentId,
        since: options.since,
        until: options.until,
        limit: parseFlagOrExit(options.limit, "--limit"),
        paginationKey: options.paginationKey,
        fields: options.fields,
      });
    });
}
