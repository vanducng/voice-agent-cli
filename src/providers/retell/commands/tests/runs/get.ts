/**
 * Test Runs Get Command
 *
 * Gets a specific test run by ID.
 */

import { getTestRun } from "../../../services/test-api";
import {
  outputJson,
  handleSdkError,
  filterFields,
} from "../../../services/output-formatter";

/**
 * Options for the get test run command
 */
export interface GetTestRunOptions {
  /** Comma-separated list of fields to return */
  fields?: string;
}

/**
 * Get a specific test run
 *
 * @param testCaseJobId The test case job ID
 * @param options Command options
 */
export async function getTestRunCommand(
  testCaseJobId: string,
  options: GetTestRunOptions,
): Promise<void> {
  try {
    const testRun = await getTestRun(testCaseJobId);

    if (options.fields) {
      const filtered = filterFields(
        testRun,
        options.fields.split(",").map((f) => f.trim()),
      );
      outputJson(filtered);
    } else {
      outputJson(testRun);
    }
  } catch (error) {
    handleSdkError(error);
  }
}
