import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import {
  parseEnabled,
  parseFriendlyName,
  parsePriority,
  parseSipUrl,
  parseWeight,
  sid,
} from "../../services/query";
import {
  listOrigination,
  mapOrigination,
  type OriginationView,
} from "../../services/views";

export interface AddOriginationOptions {
  sipUrl: string;
  priority: string;
  weight: string;
  enabled?: string;
  friendlyName?: string;
  dryRun?: boolean;
}

function sameUrl(url: OriginationView, proposed: OriginationView): boolean {
  return (
    url.sip_url === proposed.sip_url &&
    url.priority === proposed.priority &&
    url.weight === proposed.weight &&
    url.enabled === proposed.enabled &&
    (proposed.friendly_name === null ||
      url.friendly_name === proposed.friendly_name)
  );
}

export async function addOriginationCommand(
  trunkId: string,
  options: AddOriginationOptions,
): Promise<void> {
  let trunkSid = "";
  let proposed: OriginationView | undefined;
  let before: OriginationView[] | undefined;
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    proposed = {
      sip_url: parseSipUrl(options.sipUrl),
      priority: parsePriority(options.priority),
      weight: parseWeight(options.weight),
      enabled: parseEnabled(options.enabled),
      friendly_name: parseFriendlyName(options.friendlyName) ?? null,
    };
    before = await listOrigination(getTwilioClient(), trunkSid);
    if (options.dryRun) {
      outputJson({
        dry_run: true,
        trunk_sid: trunkSid,
        before,
        after: [...before, proposed],
      });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    const created = await client.trunking.v1
      .trunks(trunkSid)
      .originationUrls.create({
        sipUrl: proposed.sip_url,
        priority: proposed.priority,
        weight: proposed.weight,
        enabled: proposed.enabled,
        friendlyName: proposed.friendly_name ?? "",
      });
    const after = await listOrigination(client, trunkSid);
    const createdView = mapOrigination(created);
    if (
      !after.some(
        (url) => url.sid === createdView.sid && sameUrl(url, proposed),
      )
    ) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The origination URL read-back does not include the created URL.",
        false,
        [
          "Read the trunk again before another write.",
          "Do not add the URL again until that read shows whether it exists.",
        ],
      );
    }
    outputJson({ dry_run: false, trunk_sid: trunkSid, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}
