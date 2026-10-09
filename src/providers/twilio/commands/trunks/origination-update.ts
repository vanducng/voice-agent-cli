import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  isNotFound,
  outputJson,
} from "../../services/errors";
import {
  fail,
  parseFriendlyName,
  parseOptionalBool,
  parsePriority,
  parseSipUrl,
  parseWeight,
  sid,
} from "../../services/query";
import { listOrigination, type OriginationView } from "../../services/views";

export interface UpdateOriginationOptions {
  sipUrl?: string;
  priority?: string;
  weight?: string;
  enabled?: string;
  friendlyName?: string;
  dryRun?: boolean;
}

export async function updateOriginationCommand(
  trunkId: string,
  originationId: string,
  options: UpdateOriginationOptions,
): Promise<void> {
  let trunkSid = "";
  let originationSid = "";
  let before: OriginationView[] = [];
  let proposed: OriginationView | undefined;
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    originationSid = sid(originationId, "origination", "Origination URL");
    if (
      options.sipUrl === undefined &&
      options.priority === undefined &&
      options.weight === undefined &&
      options.enabled === undefined &&
      options.friendlyName === undefined
    ) {
      fail(
        "Provide at least one of --sip-url, --priority, --weight, --enabled, or --friendly-name.",
      );
    }
    before = await listOrigination(getTwilioClient(), trunkSid);
    const current = before.find((url) => url.sid === originationSid);
    if (!current) {
      throw new CliFailure(
        "NOT_FOUND",
        "Origination URL was not found.",
        false,
        ["Read the trunk and use an origination URL SID from that read."],
      );
    }
    proposed = {
      ...current,
      ...(options.sipUrl !== undefined
        ? { sip_url: parseSipUrl(options.sipUrl) }
        : {}),
      ...(options.priority !== undefined
        ? { priority: parsePriority(options.priority) }
        : {}),
      ...(options.weight !== undefined
        ? { weight: parseWeight(options.weight) }
        : {}),
      ...(options.enabled !== undefined
        ? { enabled: parseOptionalBool(options.enabled, "--enabled") }
        : {}),
      ...(options.friendlyName !== undefined
        ? { friendly_name: parseFriendlyName(options.friendlyName) ?? null }
        : {}),
    };
    if (options.dryRun) {
      outputJson({
        dry_run: true,
        trunk_sid: trunkSid,
        before,
        after: before.map((url) =>
          url.sid === originationSid ? proposed! : url,
        ),
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
      .update({
        ...(options.sipUrl !== undefined ? { sipUrl: proposed!.sip_url } : {}),
        ...(options.priority !== undefined
          ? { priority: proposed!.priority }
          : {}),
        ...(options.weight !== undefined ? { weight: proposed!.weight } : {}),
        ...(options.enabled !== undefined
          ? { enabled: proposed!.enabled }
          : {}),
        ...(options.friendlyName !== undefined
          ? { friendlyName: proposed!.friendly_name ?? "" }
          : {}),
      });
    const after = await listOrigination(client, trunkSid);
    const updated = after.find((url) => url.sid === originationSid);
    if (
      !updated ||
      updated.sip_url !== proposed!.sip_url ||
      updated.priority !== proposed!.priority ||
      updated.weight !== proposed!.weight ||
      updated.enabled !== proposed!.enabled ||
      updated.friendly_name !== proposed!.friendly_name
    ) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The origination URL read-back does not match the requested change.",
        false,
        [
          "Read the trunk again before another write.",
          "Do not update the URL again until that read shows the current values.",
        ],
      );
    }
    outputJson({ dry_run: false, trunk_sid: trunkSid, before, after });
  } catch (error) {
    if (isNotFound(error)) {
      handleTwilioError(
        new CliFailure("NOT_FOUND", "Origination URL was not found.", false, [
          "Read the trunk and use an origination URL SID from that read.",
        ]),
      );
    }
    handleTwilioError(error, { mutating: true });
  }
}
