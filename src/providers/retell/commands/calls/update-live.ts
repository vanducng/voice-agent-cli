import { loadJsonArg } from "../../../../core/json-arg";
import { getRetellClient } from "../../services/retell-client";
import { handleSdkError, outputJson } from "../../services/output-formatter";

const DATA_STORAGE_SETTINGS = [
  "everything",
  "everything_except_pii",
  "basic_attributes_only",
] as const;

export interface UpdateLiveCallOptions {
  dynamicVariables?: string;
  metadata?: string;
  dataStorageSetting?: string;
  additionalContext?: string;
  triggerResponse?: boolean;
}

export async function updateLiveCallCommand(
  callId: string,
  options: UpdateLiveCallOptions,
): Promise<void> {
  try {
    const fieldsToOverride: Record<string, unknown> = {};
    const callControl: Record<string, unknown> = {};

    const dynamicVariables = loadJsonArg(
      options.dynamicVariables,
      "--dynamic-variables",
    );
    if (dynamicVariables !== undefined) {
      if (
        dynamicVariables !== null &&
        (typeof dynamicVariables !== "object" ||
          Array.isArray(dynamicVariables))
      ) {
        throwValidation("--dynamic-variables must be a JSON object or null");
      }
      if (dynamicVariables !== null) {
        for (const [key, value] of Object.entries(dynamicVariables)) {
          if (typeof value !== "string") {
            throwValidation(`--dynamic-variables.${key} must be a string`);
          }
        }
      }
      fieldsToOverride.override_dynamic_variables = dynamicVariables;
    }

    const metadata = loadJsonArg(options.metadata, "--metadata");
    if (metadata !== undefined) {
      if (
        metadata === null ||
        typeof metadata !== "object" ||
        Array.isArray(metadata)
      ) {
        throwValidation("--metadata must be a JSON object");
      }
      fieldsToOverride.metadata = metadata;
    }

    if (options.dataStorageSetting !== undefined) {
      if (
        !DATA_STORAGE_SETTINGS.includes(options.dataStorageSetting as never)
      ) {
        throwValidation(
          `--data-storage-setting must be one of: ${DATA_STORAGE_SETTINGS.join(", ")}`,
        );
      }
      fieldsToOverride.data_storage_setting = options.dataStorageSetting;
    }

    if (options.additionalContext !== undefined) {
      if (options.additionalContext.trim() === "") {
        throwValidation("--additional-context must not be empty");
      }
      callControl.additional_context = options.additionalContext;
    }

    if (options.triggerResponse) {
      callControl.trigger_response = true;
    }

    if (
      Object.keys(fieldsToOverride).length === 0 &&
      Object.keys(callControl).length === 0
    ) {
      throwValidation(
        "No mutation flags provided. Pass at least one of --dynamic-variables, --metadata, --data-storage-setting, --additional-context, --trigger-response.",
      );
    }

    const result = await getRetellClient().patch<{ success: boolean }>(
      `/v2/update-live-call/${encodeURIComponent(callId)}`,
      {
        body: {
          ...(Object.keys(fieldsToOverride).length > 0
            ? { fields_to_override: fieldsToOverride }
            : {}),
          ...(Object.keys(callControl).length > 0
            ? { call_control: callControl }
            : {}),
        },
      },
    );
    outputJson(result);
  } catch (error) {
    handleSdkError(error);
  }
}

function throwValidation(message: string): never {
  const error = new Error(message);
  error.name = "ValidationError";
  throw error;
}
