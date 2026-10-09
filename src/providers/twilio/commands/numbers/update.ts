import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import { parseTrunkFlag } from "../../services/query";
import { readNumber, type NumberView } from "../../services/views";

export interface UpdateNumberOptions {
  trunk: string;
  dryRun?: boolean;
}

function withTrunk(number: NumberView, trunkSid: string | null): NumberView {
  return { ...number, trunk_sid: trunkSid };
}

export async function updateNumberCommand(
  id: string,
  options: UpdateNumberOptions,
): Promise<void> {
  let before: NumberView | undefined;
  let trunkSid: string | null | undefined;
  try {
    trunkSid = parseTrunkFlag(options.trunk);
    before = await readNumber(getTwilioClient(), id);
    if (options.dryRun) {
      outputJson({
        dry_run: true,
        before,
        after: withTrunk(before, trunkSid),
      });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    await client
      .incomingPhoneNumbers(before.sid)
      .update({ trunkSid: trunkSid ?? "" });
    const after = await readNumber(client, before.sid);
    if (after.trunk_sid !== trunkSid) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The phone number read-back does not show the requested trunk.",
        false,
        [
          "Read the number again before another write.",
          "Do not retry the update until that read shows whether the trunk changed.",
        ],
      );
    }
    outputJson({ dry_run: false, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}
