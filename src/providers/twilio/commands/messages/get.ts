import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  isNotFound,
  outputJson,
} from "../../services/errors";
import { MESSAGE_FIELDS, mapMessage } from "../../services/message-views";
import { messageSid, parseFields, project } from "../../services/query";

export async function getMessageCommand(
  id: string,
  options: { fields?: string; includeBody?: boolean } = {},
): Promise<void> {
  try {
    const sid = messageSid(id);
    const fields = parseFields(options.fields, MESSAGE_FIELDS);
    if (fields?.includes("body") && !options.includeBody) {
      throw new CliFailure(
        "VALIDATION_ERROR",
        "Pass --include-body to return the message body.",
        false,
        ["Run the command with --help and correct the arguments."],
      );
    }
    let message;
    try {
      message = await getTwilioClient().messages(sid).fetch();
    } catch (error) {
      if (isNotFound(error)) {
        throw new CliFailure("NOT_FOUND", "Message was not found.", false, [
          "Verify the message SID, then retry the read.",
        ]);
      }
      throw error;
    }
    outputJson(
      project(mapMessage(message, options.includeBody === true), fields),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
