import type { TrunkContextUpdateOptions } from "twilio/lib/rest/trunking/v1/trunk";
import type { RecordingContextUpdateOptions } from "twilio/lib/rest/trunking/v1/trunk/recording";
import { getTwilioClient } from "../../services/client";
import {
  CliFailure,
  handleTwilioError,
  outputJson,
} from "../../services/errors";
import {
  fail,
  oneOf,
  parseHttpUrl,
  parseOptionalBool,
  sid,
} from "../../services/query";
import { readTrunk, type TrunkView } from "../../services/views";

const RECORDING_MODES = [
  "do-not-record",
  "record-from-ringing",
  "record-from-answer",
  "record-from-ringing-dual",
  "record-from-answer-dual",
] as const;
const RECORDING_TRIMS = ["do-not-trim", "trim-silence"] as const;
const TRANSFER_MODES = ["disable-all", "enable-all", "sip-only"] as const;
const TRANSFER_CALLER_IDS = ["from-transferee", "from-transferor"] as const;

export interface UpdateTrunkOptions {
  disasterRecoveryUrl?: string;
  disasterRecoveryMethod?: string;
  secure?: string;
  cnamLookupEnabled?: string;
  transferMode?: string;
  transferCallerId?: string;
  recordingMode?: string;
  recordingTrim?: string;
  dryRun?: boolean;
}

function apply(trunk: TrunkView, options: UpdateTrunkOptions): TrunkView {
  const next: TrunkView = {
    ...trunk,
    recording: { ...trunk.recording },
  };
  if (options.disasterRecoveryUrl !== undefined) {
    next.disaster_recovery_url =
      parseHttpUrl(options.disasterRecoveryUrl, "--disaster-recovery-url") ||
      null;
  }
  if (options.disasterRecoveryMethod !== undefined) {
    next.disaster_recovery_method = oneOf(
      options.disasterRecoveryMethod,
      ["GET", "POST"],
      "--disaster-recovery-method",
    );
  }
  if (options.secure !== undefined) {
    next.secure = parseOptionalBool(options.secure, "--secure") ?? next.secure;
  }
  if (options.cnamLookupEnabled !== undefined) {
    next.cnam_lookup_enabled =
      parseOptionalBool(options.cnamLookupEnabled, "--cnam-lookup-enabled") ??
      next.cnam_lookup_enabled;
  }
  if (options.transferMode !== undefined) {
    next.transfer_mode = oneOf(
      options.transferMode,
      TRANSFER_MODES,
      "--transfer-mode",
    );
  }
  if (options.transferCallerId !== undefined) {
    next.transfer_caller_id = oneOf(
      options.transferCallerId,
      TRANSFER_CALLER_IDS,
      "--transfer-caller-id",
    );
  }
  if (options.recordingMode !== undefined) {
    next.recording.mode = oneOf(
      options.recordingMode,
      RECORDING_MODES,
      "--recording-mode",
    );
  }
  if (options.recordingTrim !== undefined) {
    next.recording.trim = oneOf(
      options.recordingTrim,
      RECORDING_TRIMS,
      "--recording-trim",
    );
  }
  return next;
}

function sameTrunk(left: TrunkView, right: TrunkView): boolean {
  return (
    left.disaster_recovery_url === right.disaster_recovery_url &&
    left.disaster_recovery_method === right.disaster_recovery_method &&
    left.secure === right.secure &&
    left.cnam_lookup_enabled === right.cnam_lookup_enabled &&
    left.transfer_mode === right.transfer_mode &&
    left.transfer_caller_id === right.transfer_caller_id &&
    left.recording.mode === right.recording.mode &&
    left.recording.trim === right.recording.trim
  );
}

export async function updateTrunkCommand(
  trunkId: string,
  options: UpdateTrunkOptions,
): Promise<void> {
  let trunkSid = "";
  let before: TrunkView | undefined;
  let proposed: TrunkView | undefined;
  try {
    trunkSid = sid(trunkId, "trunk", "Trunk");
    if (
      options.disasterRecoveryUrl === undefined &&
      options.disasterRecoveryMethod === undefined &&
      options.secure === undefined &&
      options.cnamLookupEnabled === undefined &&
      options.transferMode === undefined &&
      options.transferCallerId === undefined &&
      options.recordingMode === undefined &&
      options.recordingTrim === undefined
    ) {
      fail("Provide at least one trunk setting to update.");
    }
    before = await readTrunk(getTwilioClient(), trunkSid);
    proposed = apply(before, options);
    if (options.dryRun) {
      outputJson({ dry_run: true, before, after: proposed });
      return;
    }
  } catch (error) {
    handleTwilioError(error);
  }

  try {
    const client = getTwilioClient();
    const trunkUpdate: TrunkContextUpdateOptions = {};
    if (options.disasterRecoveryUrl !== undefined) {
      trunkUpdate.disasterRecoveryUrl = proposed!.disaster_recovery_url ?? "";
    }
    if (options.disasterRecoveryMethod !== undefined) {
      trunkUpdate.disasterRecoveryMethod = proposed!.disaster_recovery_method!;
    }
    if (options.secure !== undefined) trunkUpdate.secure = proposed!.secure;
    if (options.cnamLookupEnabled !== undefined) {
      trunkUpdate.cnamLookupEnabled = proposed!.cnam_lookup_enabled;
    }
    if (options.transferMode !== undefined) {
      trunkUpdate.transferMode = proposed!
        .transfer_mode as TrunkContextUpdateOptions["transferMode"];
    }
    if (options.transferCallerId !== undefined) {
      trunkUpdate.transferCallerId = proposed!
        .transfer_caller_id as TrunkContextUpdateOptions["transferCallerId"];
    }
    if (Object.keys(trunkUpdate).length > 0) {
      await client.trunking.v1.trunks(trunkSid).update(trunkUpdate);
    }
    const recordingUpdate: RecordingContextUpdateOptions = {};
    if (options.recordingMode !== undefined) {
      recordingUpdate.mode = proposed!.recording
        .mode as RecordingContextUpdateOptions["mode"];
    }
    if (options.recordingTrim !== undefined) {
      recordingUpdate.trim = proposed!.recording
        .trim as RecordingContextUpdateOptions["trim"];
    }
    if (Object.keys(recordingUpdate).length > 0) {
      // Trunk.update does not change recording. The Recording subresource does.
      await client.trunking.v1
        .trunks(trunkSid)
        .recordings()
        .update(recordingUpdate);
    }
    const after = await readTrunk(client, trunkSid);
    if (!sameTrunk(after, proposed!)) {
      throw new CliFailure(
        "RECONCILIATION_FAILED",
        "The trunk read-back does not match the requested change.",
        false,
        [
          "Read the trunk again before another write.",
          "Do not update the trunk again until that read shows the current settings.",
        ],
      );
    }
    outputJson({ dry_run: false, before, after });
  } catch (error) {
    handleTwilioError(error, { mutating: true });
  }
}
