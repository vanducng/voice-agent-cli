import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import { sid } from "../../services/query";
import { listOrigination, type OriginationView } from "../../services/views";

export async function removeOriginationCommand(
  trunkId: string,
  originationId: string,
  options: { dryRun?: boolean } = {},
): Promise<void> {
  let trunkSid = "";
  let originationSid = "";
  let before: OriginationView[] | undefined;
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    originationSid = sid(originationId, "origination", "Origination URL");
    before = await listOrigination(getTwilioClient(), trunkSid);
    if (!before.some((url) => url.sid === originationSid)) {
      throw new CliFailure(
        "NOT_FOUND",
        before.length >= 1000
          ? "Origination URL was not found in the first 1000 URLs on this trunk."
          : "Origination URL was not found on this trunk.",
        false,
        ["Verify the origination URL SID, then retry the read."],
      );
    }
    if (options.dryRun) {
      outputJson({
        dry_run: true,
        trunk_sid: trunkSid,
        origination_url_sid: originationSid,
        before,
        after: before.filter((url) => url.sid !== originationSid),
      });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    await client.trunking.v1
      .trunks(trunkSid)
      .originationUrls(originationSid)
      .remove();
    const after = await listOrigination(client, trunkSid);
    if (after.some((url) => url.sid === originationSid)) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The origination URL is still present after removal.",
        false,
        [
          "Read the trunk again before another write.",
          "Do not remove the URL again until that read shows whether it is gone.",
        ],
      );
    }
    outputJson({
      dry_run: false,
      trunk_sid: trunkSid,
      origination_url_sid: originationSid,
      before,
      after,
    });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}
