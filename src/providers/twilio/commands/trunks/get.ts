import { getTwilioClient } from "../../services/client";
import { handleTwilioError, outputJson } from "../../services/errors";
import { parseFields, project } from "../../services/query";
import { readTrunk, TRUNK_FIELDS } from "../../services/views";

export async function getTrunkCommand(
  id: string,
  options: { fields?: string } = {},
): Promise<void> {
  try {
    const fields = parseFields(options.fields, TRUNK_FIELDS);
    outputJson(project(await readTrunk(getTwilioClient(), id), fields));
  } catch (error) {
    handleTwilioError(error);
  }
}
