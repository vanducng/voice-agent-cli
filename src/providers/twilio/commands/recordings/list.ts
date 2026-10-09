import { getTwilioClient } from "../../services/client";
import {
  RECORDING_FIELDS,
  listRecordings,
} from "../../services/diagnostic-views";
import { handleTwilioError, outputJson } from "../../services/errors";
import { parseFields, parseUtcIso, sid } from "../../services/query";

export async function listRecordingsCommand(
  options: {
    call?: string;
    createdAfter?: string;
    createdBefore?: string;
    limit?: string;
    paginationKey?: string;
    fields?: string;
  } = {},
): Promise<void> {
  try {
    outputJson(
      await listRecordings(getTwilioClient(), {
        callSid: options.call ? sid(options.call, "call", "--call") : undefined,
        dateCreatedAfter: options.createdAfter
          ? parseUtcIso(options.createdAfter, "--created-after")
          : undefined,
        dateCreatedBefore: options.createdBefore
          ? parseUtcIso(options.createdBefore, "--created-before")
          : undefined,
        limit: options.limit,
        paginationKey: options.paginationKey,
        fields: parseFields(options.fields, RECORDING_FIELDS),
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
