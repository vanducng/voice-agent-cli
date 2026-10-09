import { getTwilioClient } from "../../services/client";
import {
  CALL_EVENT_FIELDS,
  listCallEvents,
} from "../../services/diagnostic-views";
import {
  CliFailure,
  handleTwilioError,
  isNotFound,
  outputJson,
} from "../../services/errors";
import { parseFields, sid } from "../../services/query";

export async function listCallEventsCommand(
  id: string,
  options: { limit?: string; paginationKey?: string; fields?: string } = {},
): Promise<void> {
  try {
    const callSid = sid(id, "call", "Call");
    outputJson(
      await listCallEvents(getTwilioClient(), callSid, {
        ...options,
        fields: parseFields(options.fields, CALL_EVENT_FIELDS),
      }),
    );
  } catch (error) {
    if (isNotFound(error)) {
      handleTwilioError(
        new CliFailure("NOT_FOUND", "Call events were not found.", false, [
          "Wait about 15 minutes after a Programmable Voice call ends, then retry.",
          "Elastic SIP trunk calls do not have this subresource.",
        ]),
      );
    }
    handleTwilioError(error);
  }
}
