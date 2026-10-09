import { getTwilioClient } from "../../services/client";
import { handleTwilioError, outputJson } from "../../services/errors";
import { parseFields } from "../../services/query";
import { listNumbers, NUMBER_FIELDS } from "../../services/views";

export interface ListNumbersOptions {
  limit?: string;
  paginationKey?: string;
  fields?: string;
}

export async function listNumbersCommand(
  options: ListNumbersOptions = {},
): Promise<void> {
  try {
    const fields = parseFields(options.fields, NUMBER_FIELDS);
    outputJson(
      await listNumbers(getTwilioClient(), {
        limit: options.limit,
        paginationKey: options.paginationKey,
        fields,
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
