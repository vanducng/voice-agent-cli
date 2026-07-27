import type { Command } from "commander";
import { listTestCasesCommand } from "./cases/list";
import { getTestCaseCommand } from "./cases/get";
import { createTestCaseCommand } from "./cases/create";
import { updateTestCaseCommand } from "./cases/update";
import { deleteTestCaseCommand } from "./cases/delete";
import { listBatchTestsCommand } from "./batch/list";
import { getBatchTestCommand } from "./batch/get";
import { createBatchTestCommand } from "./batch/create";
import { listTestRunsCommand } from "./runs/list";
import { getTestRunCommand } from "./runs/get";
import {
  parseFlagOrExit,
  parsePositiveIntegerFlagOrExit,
} from "../register-flags";
import { outputError } from "../../services/output-formatter";

export function registerTestsCommands(program: Command): void {
  const tests = program
    .command("tests")
    .description("Manage test cases, batch tests, and test runs");

  const testsCases = tests
    .command("cases")
    .description("Manage test case definitions");

  testsCases
    .command("list")
    .description("List all test case definitions for an LLM or flow")
    .requiredOption(
      "-t, --type <type>",
      "Response engine type (retell-llm or conversation-flow)",
    )
    .option("--llm-id <id>", "LLM ID (required when type is retell-llm)")
    .option(
      "--flow-id <id>",
      "Flow ID (required when type is conversation-flow)",
    )
    .option("--limit <n>", "Maximum number of test case definitions to return")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests cases list --type retell-llm --llm-id llm_abc123
  $ vac retell tests cases list --type conversation-flow --flow-id cf_abc123
  $ vac retell tests cases list --type retell-llm --llm-id llm_abc123 --limit 25 --pagination-key next
  $ vac retell tests cases list --type retell-llm --llm-id llm_abc123 --fields test_case_definitions
  `,
    )
    .action(async (options) => {
      if (
        options.type !== "retell-llm" &&
        options.type !== "conversation-flow"
      ) {
        outputError(
          'type must be "retell-llm" or "conversation-flow"',
          "VALIDATION_ERROR",
        );
      }
      await listTestCasesCommand({
        type: options.type,
        llmId: options.llmId,
        flowId: options.flowId,
        limit: parsePositiveIntegerFlagOrExit(options.limit, "--limit"),
        paginationKey: options.paginationKey,
        fields: options.fields,
      });
    });

  testsCases
    .command("get <test_case_definition_id>")
    .description("Get a specific test case definition")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests cases get tcd_abc123
  $ vac retell tests cases get tcd_abc123 --fields name,user_prompt
  `,
    )
    .action(async (testCaseDefinitionId, options) => {
      await getTestCaseCommand(testCaseDefinitionId, {
        fields: options.fields,
      });
    });

  testsCases
    .command("create")
    .description("Create a new test case definition from a JSON file")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing test case definition",
    )
    .option("--llm-id <id>", "LLM ID (mutually exclusive with --flow-id)")
    .option("--flow-id <id>", "Flow ID (mutually exclusive with --llm-id)")
    .option(
      "--engine-version <number>",
      "Version of the LLM or flow (optional)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests cases create --file test-case.json --llm-id llm_abc123
  $ vac retell tests cases create --file test-case.json --flow-id cf_abc123
  $ vac retell tests cases create --file test-case.json --llm-id llm_abc123 --engine-version 2

Test case JSON format:
  {
    "name": "Greeting Test",
    "user_prompt": "Hello, I need help with my order",
    "scenario": "User is calling about an order issue",
    "metrics": ["response_quality", "task_completion"]
  }
  `,
    )
    .action(async (options) => {
      await createTestCaseCommand({
        file: options.file,
        llmId: options.llmId,
        flowId: options.flowId,
        version: parseFlagOrExit(options.engineVersion, "--engine-version"),
      });
    });

  testsCases
    .command("update <test_case_definition_id>")
    .description("Update an existing test case definition from a JSON file")
    .requiredOption(
      "-f, --file <path>",
      "Path to JSON file containing test case updates",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests cases update tcd_abc123 --file test-case.json
  `,
    )
    .action(async (testCaseDefinitionId, options) => {
      await updateTestCaseCommand(testCaseDefinitionId, {
        file: options.file,
      });
    });

  testsCases
    .command("delete <test_case_definition_id>")
    .description("Delete a test case definition")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests cases delete tcd_abc123
  `,
    )
    .action(async (testCaseDefinitionId) => {
      await deleteTestCaseCommand(testCaseDefinitionId);
    });

  const testsBatch = tests.command("batch").description("Manage batch tests");

  testsBatch
    .command("list")
    .description("List all batch tests for an LLM or flow")
    .requiredOption(
      "-t, --type <type>",
      "Response engine type (retell-llm or conversation-flow)",
    )
    .option("--llm-id <id>", "LLM ID (required when type is retell-llm)")
    .option(
      "--flow-id <id>",
      "Flow ID (required when type is conversation-flow)",
    )
    .option("--limit <n>", "Maximum number of batch tests to return")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests batch list --type retell-llm --llm-id llm_abc123
  $ vac retell tests batch list --type conversation-flow --flow-id cf_abc123
  $ vac retell tests batch list --type retell-llm --llm-id llm_abc123 --limit 25 --pagination-key next
  $ vac retell tests batch list --type retell-llm --llm-id llm_abc123 --fields batch_tests
  `,
    )
    .action(async (options) => {
      if (
        options.type !== "retell-llm" &&
        options.type !== "conversation-flow"
      ) {
        outputError(
          'type must be "retell-llm" or "conversation-flow"',
          "VALIDATION_ERROR",
        );
      }
      await listBatchTestsCommand({
        type: options.type,
        llmId: options.llmId,
        flowId: options.flowId,
        limit: parsePositiveIntegerFlagOrExit(options.limit, "--limit"),
        paginationKey: options.paginationKey,
        fields: options.fields,
      });
    });

  testsBatch
    .command("get <batch_job_id>")
    .description("Get a specific batch test with its status and stats")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests batch get bjj_abc123
  $ vac retell tests batch get bjj_abc123 --fields status,stats
  `,
    )
    .action(async (batchJobId, options) => {
      await getBatchTestCommand(batchJobId, {
        fields: options.fields,
      });
    });

  testsBatch
    .command("create")
    .description("Create a new batch test with specified test case definitions")
    .option("--llm-id <id>", "LLM ID (mutually exclusive with --flow-id)")
    .option("--flow-id <id>", "Flow ID (mutually exclusive with --llm-id)")
    .requiredOption(
      "--cases <ids>",
      "Comma-separated list of test case definition IDs",
    )
    .option(
      "--engine-version <number>",
      "Version of the LLM or flow (optional)",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests batch create --llm-id llm_abc123 --cases tcd_xxx,tcd_yyy,tcd_zzz
  $ vac retell tests batch create --flow-id cf_abc123 --cases tcd_xxx,tcd_yyy
  $ vac retell tests batch create --llm-id llm_abc123 --cases tcd_xxx --engine-version 2
  `,
    )
    .action(async (options) => {
      await createBatchTestCommand({
        llmId: options.llmId,
        flowId: options.flowId,
        cases: options.cases,
        version: parseFlagOrExit(options.engineVersion, "--engine-version"),
      });
    });

  const testsRuns = tests.command("runs").description("View test run results");

  testsRuns
    .command("list <batch_job_id>")
    .description("List all test runs for a batch test")
    .option("--limit <n>", "Maximum number of test runs to return")
    .option("--pagination-key <key>", "Pagination key for the next page")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests runs list bjj_abc123
  $ vac retell tests runs list bjj_abc123 --limit 25 --pagination-key next
  $ vac retell tests runs list bjj_abc123 --fields test_runs
  `,
    )
    .action(async (batchJobId, options) => {
      await listTestRunsCommand(batchJobId, {
        limit: parsePositiveIntegerFlagOrExit(options.limit, "--limit"),
        paginationKey: options.paginationKey,
        fields: options.fields,
      });
    });

  testsRuns
    .command("get <test_run_id>")
    .description("Get a specific test run result")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell tests runs get tcj_abc123
  $ vac retell tests runs get tcj_abc123 --fields status,metric_results
  `,
    )
    .action(async (testRunId, options) => {
      await getTestRunCommand(testRunId, {
        fields: options.fields,
      });
    });
}
