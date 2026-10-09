import { getTwilioClient } from "../../services/client";
import { handleTwilioError, outputJson } from "../../services/errors";
import { parseFields, project } from "../../services/query";
import { NUMBER_FIELDS, readNumber } from "../../services/views";

export async function getNumberCommand(
  id: string,
  options: { fields?: string } = {},
): Promise<void> {
  try {
    const fields = parseFields(options.fields, NUMBER_FIELDS);
    const number = await readNumber(getTwilioClient(), id);
    outputJson(project(number, fields));
  } catch (error) {
    handleTwilioError(error);
  }
}
