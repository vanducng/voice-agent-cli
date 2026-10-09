import { getTwilioClient } from "../../services/client";
import { ALERT_FIELDS, mapAlert } from "../../services/diagnostic-views";
import {
  CliFailure,
  handleTwilioError,
  isNotFound,
  outputJson,
} from "../../services/errors";
import { parseFields, project, sid } from "../../services/query";

export async function getAlertCommand(
  id: string,
  options: { fields?: string } = {},
): Promise<void> {
  try {
    const alertSid = sid(id, "alert", "Alert");
    const fields = parseFields(options.fields, ALERT_FIELDS);
    let alert;
    try {
      alert = await getTwilioClient().monitor.v1.alerts(alertSid).fetch();
    } catch (error) {
      if (isNotFound(error)) {
        throw new CliFailure("NOT_FOUND", "Alert was not found.", false, [
          "Verify the alert SID, then retry the read.",
        ]);
      }
      throw error;
    }
    outputJson(project(mapAlert(alert, true), fields));
  } catch (error) {
    handleTwilioError(error);
  }
}
