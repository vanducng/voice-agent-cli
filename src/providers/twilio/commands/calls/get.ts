import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import { parseFields, project, sid } from "../../services/query";
import { CALL_FIELDS, mapCall } from "../../services/views";

export async function getCallCommand(
  id: string,
  options: { fields?: string } = {},
): Promise<void> {
  try {
    const callSid = sid(id, "call", "Call");
    const fields = parseFields(options.fields, CALL_FIELDS);
    let call;
    try {
      call = await getTwilioClient().calls(callSid).fetch();
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status?: number }).status === 404
      ) {
        throw new CliFailure("NOT_FOUND", "Call was not found.", false, [
          "Verify the call SID, then retry the read.",
        ]);
      }
      throw error;
    }
    outputJson(project(mapCall(call), fields));
  } catch (error) {
    handleTwilioError(error);
  }
}
