import type { CallResponse } from "retell-sdk/resources/call";
import { loadStringRecordArg } from "../../../../core/json-arg";
import { getRetellClient } from "../../services/retell-client";
import {
  filterFields,
  handleSdkError,
  outputJson,
} from "../../services/output-formatter";

export interface UpdateLiveCallOptions {
  dynamicVariables?: string;
  fields?: string;
}

export async function updateLiveCallCommand(
  callId: string,
  options: UpdateLiveCallOptions,
): Promise<void> {
  try {
    const dynamicVariables = loadStringRecordArg(
      options.dynamicVariables,
      "--dynamic-variables",
    );
    if (dynamicVariables === undefined) {
      const error = new Error(
        "No mutation flags provided. Pass --dynamic-variables.",
      );
      error.name = "ValidationError";
      throw error;
    }

    const result = await getRetellClient().patch<CallResponse>(
      `/v2/update-live-call/${encodeURIComponent(callId)}`,
      {
        body: {
          fields_to_override: {
            override_dynamic_variables: dynamicVariables,
          },
        },
      },
    );
    const output = options.fields
      ? filterFields(
          result,
          options.fields.split(",").map((field) => field.trim()),
        )
      : result;

    outputJson(output);
  } catch (error) {
    handleSdkError(error);
  }
}
