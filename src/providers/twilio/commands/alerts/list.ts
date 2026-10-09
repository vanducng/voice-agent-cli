import { getTwilioClient } from "../../services/client";
import { ALERT_FIELDS, listAlerts } from "../../services/diagnostic-views";
import { handleTwilioError, outputJson } from "../../services/errors";
import { oneOf, parseFields, parseUtcIso } from "../../services/query";

const LOG_LEVELS = ["error", "warning", "notice", "debug"] as const;

export async function listAlertsCommand(
  options: {
    logLevel?: string;
    startAfter?: string;
    endBefore?: string;
    limit?: string;
    paginationKey?: string;
    fields?: string;
  } = {},
): Promise<void> {
  try {
    outputJson(
      await listAlerts(getTwilioClient(), {
        logLevel: options.logLevel
          ? oneOf(options.logLevel, LOG_LEVELS, "--log-level")
          : undefined,
        startDate: options.startAfter
          ? parseUtcIso(options.startAfter, "--start-after")
          : undefined,
        endDate: options.endBefore
          ? parseUtcIso(options.endBefore, "--end-before")
          : undefined,
        limit: options.limit,
        paginationKey: options.paginationKey,
        fields: parseFields(options.fields, ALERT_FIELDS),
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
