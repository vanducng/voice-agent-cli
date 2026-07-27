import { getRetellClient } from "./retell-client";
import {
  getPaginatedResult,
  type PaginatedResult,
} from "../../../core/paginated-response";
import type {
  BatchTestResponse,
  TestCaseDefinitionResponse,
  TestCaseJobResponse,
  TestCreateBatchTestParams,
  TestCreateTestCaseDefinitionParams,
  TestListBatchTestsParams,
  TestListTestCaseDefinitionsParams,
  TestListTestRunsParams,
  TestUpdateTestCaseDefinitionParams,
} from "retell-sdk/resources/tests";
import type { ResponseEngine } from "../types/tests";

export async function listTestCaseDefinitions(
  responseEngine: ResponseEngine,
  query?: Pick<TestListTestCaseDefinitionsParams, "limit" | "pagination_key">,
): Promise<PaginatedResult<TestCaseDefinitionResponse>> {
  const client = getRetellClient();
  const { version, ...engine } = responseEngine;
  const params: TestListTestCaseDefinitionsParams = {
    ...engine,
    ...(version != null ? { version } : {}),
    ...query,
  };
  const response = await client.tests.listTestCaseDefinitions(params);
  return getPaginatedResult(response);
}

export async function getTestCaseDefinition(
  testCaseDefinitionId: string,
): Promise<TestCaseDefinitionResponse> {
  return getRetellClient().tests.getTestCaseDefinition(testCaseDefinitionId);
}

export async function createTestCaseDefinition(
  params: TestCreateTestCaseDefinitionParams,
): Promise<TestCaseDefinitionResponse> {
  return getRetellClient().tests.createTestCaseDefinition(params);
}

export async function updateTestCaseDefinition(
  testCaseDefinitionId: string,
  params: TestUpdateTestCaseDefinitionParams,
): Promise<TestCaseDefinitionResponse> {
  return getRetellClient().tests.updateTestCaseDefinition(
    testCaseDefinitionId,
    params,
  );
}

export async function deleteTestCaseDefinition(
  testCaseDefinitionId: string,
): Promise<void> {
  await getRetellClient().tests.deleteTestCaseDefinition(testCaseDefinitionId);
}

export async function listBatchTests(
  responseEngine: ResponseEngine,
  query?: Pick<TestListBatchTestsParams, "limit" | "pagination_key">,
): Promise<PaginatedResult<BatchTestResponse>> {
  const client = getRetellClient();
  const { version, ...engine } = responseEngine;
  const params: TestListBatchTestsParams = {
    ...engine,
    ...(version != null ? { version } : {}),
    ...query,
  };
  const response = await client.tests.listBatchTests(params);
  return getPaginatedResult(response);
}

export async function getBatchTest(
  batchJobId: string,
): Promise<BatchTestResponse> {
  return getRetellClient().tests.getBatchTest(batchJobId);
}

export async function createBatchTest(
  params: TestCreateBatchTestParams,
): Promise<BatchTestResponse> {
  return getRetellClient().tests.createBatchTest(params);
}

export async function listTestRuns(
  batchJobId: string,
  query?: Pick<TestListTestRunsParams, "limit" | "pagination_key">,
): Promise<PaginatedResult<TestCaseJobResponse>> {
  const response = await getRetellClient().tests.listTestRuns(
    batchJobId,
    query,
  );
  return getPaginatedResult(response);
}

export async function getTestRun(
  testCaseJobId: string,
): Promise<TestCaseJobResponse> {
  return getRetellClient().tests.getTestRun(testCaseJobId);
}
