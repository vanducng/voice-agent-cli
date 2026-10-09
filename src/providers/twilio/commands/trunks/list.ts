import { getTwilioClient } from "../../services/client";
import { handleTwilioError, outputJson } from "../../services/errors";
import { parseFields } from "../../services/query";
import { listTrunks, TRUNK_FIELDS } from "../../services/views";

export interface ListTrunksOptions {
  limit?: string;
  paginationKey?: string;
  fields?: string;
}

export async function listTrunksCommand(
  options: ListTrunksOptions = {},
): Promise<void> {
  try {
    outputJson(
      await listTrunks(getTwilioClient(), {
        limit: options.limit,
        paginationKey: options.paginationKey,
        fields: parseFields(options.fields, TRUNK_FIELDS),
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
