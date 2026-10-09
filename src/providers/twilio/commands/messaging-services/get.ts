import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  isNotFound,
  outputJson,
} from "../../services/errors";
import { SERVICE_FIELDS, mapService } from "../../services/message-views";
import { emptyToNull, parseFields, project, sid } from "../../services/query";

export async function getServiceCommand(
  id: string,
  options: { fields?: string } = {},
): Promise<void> {
  try {
    const serviceSid = sid(id, "messagingService", "Messaging service");
    const fields = parseFields(options.fields, SERVICE_FIELDS);
    const client = getTwilioClient();
    let service;
    try {
      service = await client.messaging.v1.services(serviceSid).fetch();
    } catch (error) {
      if (isNotFound(error)) {
        throw new CliFailure(
          "NOT_FOUND",
          "Messaging service was not found.",
          false,
          ["Verify the messaging service SID, then retry the read."],
        );
      }
      throw error;
    }
    const numbers = await client.messaging.v1
      .services(serviceSid)
      .phoneNumbers.list({ limit: 1000 });
    outputJson(
      project(
        mapService(
          service,
          numbers.map((number) => ({
            sid: number.sid,
            phone_number: emptyToNull(number.phoneNumber),
          })),
        ),
        fields,
      ),
    );
  } catch (error) {
    handleTwilioError(error);
  }
}
