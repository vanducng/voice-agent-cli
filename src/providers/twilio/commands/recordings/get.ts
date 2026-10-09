import { getTwilioClient } from "../../services/client";
import {
  RECORDING_FIELDS,
  mapRecording,
} from "../../services/diagnostic-views";
import {
  CliFailure,
  handleTwilioError,
  isNotFound,
  outputJson,
} from "../../services/errors";
import { parseFields, project, sid } from "../../services/query";

export async function getRecordingCommand(
  id: string,
  options: { fields?: string } = {},
): Promise<void> {
  try {
    const recordingSid = sid(id, "recording", "Recording");
    const fields = parseFields(options.fields, RECORDING_FIELDS);
    let recording;
    try {
      recording = await getTwilioClient().recordings(recordingSid).fetch();
    } catch (error) {
      if (isNotFound(error)) {
        throw new CliFailure("NOT_FOUND", "Recording was not found.", false, [
          "Verify the recording SID, then retry the read.",
        ]);
      }
      throw error;
    }
    outputJson(project(mapRecording(recording), fields));
  } catch (error) {
    handleTwilioError(error);
  }
}
