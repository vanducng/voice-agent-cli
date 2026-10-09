import { getTwilioClient } from "../../services/client";
import { handleTwilioError, outputJson } from "../../services/errors";
import { SERVICE_FIELDS, listServices } from "../../services/message-views";
import { parseFields } from "../../services/query";

export async function listServicesCommand(
  options: { limit?: string; paginationKey?: string; fields?: string } = {},
): Promise<void> {
  try {
    outputJson(
      await listServices(getTwilioClient(), {
        ...options,
        fields: parseFields(options.fields, SERVICE_FIELDS),
      }),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
