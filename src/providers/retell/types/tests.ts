import type {
  BatchTestResponse,
  TestCaseDefinitionResponse,
  TestCaseJobResponse,
  TestCreateTestCaseDefinitionParams,
  TestUpdateTestCaseDefinitionParams,
} from "retell-sdk/resources/tests";

export type ResponseEngine =
  TestCreateTestCaseDefinitionParams["response_engine"];
export type TestCaseDefinition = TestCaseDefinitionResponse;
export type TestCaseDefinitionCreateInput = Omit<
  TestCreateTestCaseDefinitionParams,
  "response_engine"
>;
export type TestCaseDefinitionUpdateInput = TestUpdateTestCaseDefinitionParams;
export type BatchTest = BatchTestResponse;
export type TestRun = TestCaseJobResponse;

export interface TestCaseDefinitionListOutput {
  response_engine: ResponseEngine;
  test_case_definitions: TestCaseDefinition[];
  total_count: number;
  has_more?: boolean;
  pagination_key?: string;
}

export interface TestCaseDefinitionMutationOutput {
  message: string;
  test_case_definition_id: string;
  name: string;
  operation: "create" | "update" | "delete";
  response_engine: ResponseEngine;
}

export interface BatchTestListOutput {
  response_engine: ResponseEngine;
  batch_tests: BatchTest[];
  total_count: number;
  has_more?: boolean;
  pagination_key?: string;
}

export interface BatchTestCreateOutput {
  message: string;
  test_case_batch_job_id: string;
  status: BatchTest["status"];
  response_engine: ResponseEngine;
  test_case_definition_ids: string[];
}

export interface TestRunListOutput {
  batch_job_id: string;
  test_runs: TestRun[];
  total_count: number;
  has_more?: boolean;
  pagination_key?: string;
}
