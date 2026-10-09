import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import { MESSAGE_FIELDS, listMessages } from "../../services/message-views";
import { parseFields, parseUtcIso } from "../../services/query";

export async function listMessagesCommand(
  options: {
    to?: string;
    from?: string;
    sentAfter?: string;
    sentBefore?: string;
    limit?: string;
    paginationKey?: string;
    fields?: string;
    includeBody?: boolean;
  } = {},
): Promise<void> {
  try {
    const fields = parseFields(options.fields, MESSAGE_FIELDS);
    if (fields?.includes("body") && options.includeBody !== true) {
      throw new CliFailure(
        "VALIDATION_ERROR",
        "Pass --include-body to return the message body.",
        false,
        ["Run the command with --help and correct the arguments."],
      );
    }
    outputJson(
      await listMessages(getTwilioClient(), {
        to: options.to,
        from: options.from,
        dateSentAfter: options.sentAfter
          ? parseUtcIso(options.sentAfter, "--sent-after")
          : undefined,
        dateSentBefore: options.sentBefore
          ? parseUtcIso(options.sentBefore, "--sent-before")
          : undefined,
        limit: options.limit,
        paginationKey: options.paginationKey,
        fields,
        includeBody: options.includeBody,
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
