import type Twilio from "twilio";
import { CliFailure } from "./errors";
import {
  e164OrNumberSid,
  emptyToNull,
  isoTimestamp,
  pageQuery,
  pageResult,
  sid,
} from "./query";

export interface NumberView {
  sid: string;
  phone_number: string;
  friendly_name: string | null;
  trunk_sid: string | null;
  voice_url: string | null;
  voice_method: string | null;
  voice_application_sid: string | null;
  sms_url: string | null;
  status_callback: string | null;
}

export const NUMBER_FIELDS = [
  "sid",
  "phone_number",
  "friendly_name",
  "trunk_sid",
  "voice_url",
  "voice_method",
  "voice_application_sid",
  "sms_url",
  "status_callback",
] as const;

export interface OriginationView {
  sid?: string;
  sip_url: string;
  enabled: boolean;
  priority: number;
  weight: number;
  friendly_name: string | null;
}

export interface TrunkNumberView {
  sid: string;
  phone_number: string;
  friendly_name: string | null;
}

export interface TrunkView {
  sid: string;
  domain_name: string | null;
  friendly_name: string | null;
  secure: boolean;
  transfer_mode: string | null;
  transfer_caller_id: string | null;
  recording: { mode: string | null; trim: string | null };
  auth_type: string | null;
  disaster_recovery_url: string | null;
  disaster_recovery_method: string | null;
  cnam_lookup_enabled: boolean;
  symmetric_rtp_enabled: boolean;
  origination_urls: OriginationView[];
  phone_numbers: TrunkNumberView[];
}

export const TRUNK_FIELDS = [
  "sid",
  "domain_name",
  "friendly_name",
  "secure",
  "transfer_mode",
  "transfer_caller_id",
  "recording",
  "auth_type",
  "disaster_recovery_url",
  "disaster_recovery_method",
  "cnam_lookup_enabled",
  "symmetric_rtp_enabled",
  "origination_urls",
  "phone_numbers",
] as const;

export interface CallView {
  sid: string;
  from: string | null;
  to: string | null;
  status: string | null;
  direction: string | null;
  start_time: string | null;
  end_time: string | null;
  duration: string | null;
  trunk_sid: string | null;
  phone_number_sid: string | null;
  parent_call_sid: string | null;
  answered_by: string | null;
  queue_time: string | null;
}

export const CALL_FIELDS = [
  "sid",
  "from",
  "to",
  "status",
  "direction",
  "start_time",
  "end_time",
  "duration",
  "trunk_sid",
  "phone_number_sid",
  "parent_call_sid",
  "answered_by",
  "queue_time",
] as const;

type NumberInstance = {
  sid: string;
  phoneNumber: string;
  friendlyName?: string;
  trunkSid?: string;
  voiceUrl?: string;
  voiceMethod?: string;
  voiceApplicationSid?: string;
  smsUrl?: string;
  statusCallback?: string;
};

type OriginationInstance = {
  sid: string;
  sipUrl: string;
  enabled: boolean;
  priority: number;
  weight: number;
  friendlyName?: string;
};

type TrunkNumberInstance = {
  sid: string;
  phoneNumber: string;
  friendlyName?: string;
};

type TrunkInstance = {
  sid: string;
  domainName?: string;
  friendlyName?: string;
  secure?: boolean;
  transferMode?: string;
  transferCallerId?: string;
  recording?: { mode?: string; trim?: string };
  authType?: string;
  disasterRecoveryUrl?: string;
  disasterRecoveryMethod?: string;
  cnamLookupEnabled?: boolean;
  symmetricRtpEnabled?: boolean;
};

type CallInstance = {
  sid: string;
  from?: string;
  to?: string;
  status?: string;
  direction?: string;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  duration?: string;
  trunkSid?: string;
  phoneNumberSid?: string;
  parentCallSid?: string;
  answeredBy?: string;
  queueTime?: string;
};

export function mapNumber(number: NumberInstance): NumberView {
  return {
    sid: number.sid,
    phone_number: number.phoneNumber,
    friendly_name: emptyToNull(number.friendlyName),
    trunk_sid: emptyToNull(number.trunkSid),
    voice_url: emptyToNull(number.voiceUrl),
    voice_method: emptyToNull(number.voiceMethod),
    voice_application_sid: emptyToNull(number.voiceApplicationSid),
    sms_url: emptyToNull(number.smsUrl),
    status_callback: emptyToNull(number.statusCallback),
  };
}

export function mapOrigination(url: OriginationInstance): OriginationView {
  return {
    sid: url.sid,
    sip_url: url.sipUrl,
    enabled: url.enabled,
    priority: url.priority,
    weight: url.weight,
    friendly_name: emptyToNull(url.friendlyName),
  };
}

export function mapTrunk(
  trunk: TrunkInstance,
  originationUrls: OriginationInstance[],
  phoneNumbers: TrunkNumberInstance[],
): TrunkView {
  return {
    sid: trunk.sid,
    domain_name: emptyToNull(trunk.domainName),
    friendly_name: emptyToNull(trunk.friendlyName),
    secure: trunk.secure === true,
    transfer_mode: emptyToNull(trunk.transferMode),
    transfer_caller_id: emptyToNull(trunk.transferCallerId),
    recording: {
      mode: emptyToNull(trunk.recording?.mode),
      trim: emptyToNull(trunk.recording?.trim),
    },
    auth_type: emptyToNull(trunk.authType),
    disaster_recovery_url: emptyToNull(trunk.disasterRecoveryUrl),
    disaster_recovery_method: emptyToNull(trunk.disasterRecoveryMethod),
    cnam_lookup_enabled: trunk.cnamLookupEnabled === true,
    symmetric_rtp_enabled: trunk.symmetricRtpEnabled === true,
    origination_urls: originationUrls.map(mapOrigination),
    phone_numbers: phoneNumbers.map((number) => ({
      sid: number.sid,
      phone_number: number.phoneNumber,
      friendly_name: emptyToNull(number.friendlyName),
    })),
  };
}

export function mapCall(call: CallInstance): CallView {
  return {
    sid: call.sid,
    from: emptyToNull(call.from),
    to: emptyToNull(call.to),
    status: emptyToNull(call.status),
    direction: emptyToNull(call.direction),
    start_time: isoTimestamp(call.startTime),
    end_time: isoTimestamp(call.endTime),
    duration: emptyToNull(call.duration),
    trunk_sid: emptyToNull(call.trunkSid),
    phone_number_sid: emptyToNull(call.phoneNumberSid),
    parent_call_sid: emptyToNull(call.parentCallSid),
    answered_by: emptyToNull(call.answeredBy),
    queue_time: emptyToNull(call.queueTime),
  };
}

function notFound(message: string): never {
  throw new CliFailure("NOT_FOUND", message, false, [
    "Verify the SID or E.164 number, then retry the read.",
  ]);
}

export async function readNumber(
  client: Twilio.Twilio,
  id: string,
): Promise<NumberView> {
  const target = e164OrNumberSid(id);
  if (target.sid) {
    try {
      return mapNumber(await client.incomingPhoneNumbers(target.sid).fetch());
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status?: number }).status === 404
      ) {
        notFound("Incoming phone number was not found.");
      }
      throw error;
    }
  }

  const page = await client.incomingPhoneNumbers.page({
    phoneNumber: target.phoneNumber,
    pageSize: 1,
  });
  const match = page.instances.find(
    (number) => number.phoneNumber === target.phoneNumber,
  );
  if (!match) notFound("Incoming phone number was not found.");
  return mapNumber(match);
}

export async function listNumbers(
  client: Twilio.Twilio,
  options: { limit?: string; paginationKey?: string; fields?: string[] },
): Promise<{
  items: NumberView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.incomingPhoneNumbers.page(pageQuery(options));
  return pageResult(
    page.instances.map(mapNumber),
    page.nextPageUrl,
    options.fields,
  );
}

async function readTrunkRecord(
  client: Twilio.Twilio,
  trunk: TrunkInstance,
): Promise<TrunkView> {
  // Listed trunk instances omit the SID the SDK uses for nested resources.
  const context = client.trunking.v1.trunks(trunk.sid);
  const [originationUrls, phoneNumbers] = await Promise.all([
    context.originationUrls.list({ limit: 1000 }),
    context.phoneNumbers.list({ limit: 1000 }),
  ]);
  return mapTrunk(trunk, originationUrls, phoneNumbers);
}

export async function readTrunk(
  client: Twilio.Twilio,
  id: string,
): Promise<TrunkView> {
  const trunkSid = sid(id, "trunk", "Trunk");
  try {
    const trunk = await client.trunking.v1.trunks(trunkSid).fetch();
    return readTrunkRecord(client, trunk as unknown as TrunkInstance);
  } catch (error) {
    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      notFound("Trunk was not found.");
    }
    throw error;
  }
}

export async function listTrunks(
  client: Twilio.Twilio,
  options: { limit?: string; paginationKey?: string; fields?: string[] },
): Promise<{ items: TrunkView[]; has_more: boolean; pagination_key?: string }> {
  const page = await client.trunking.v1.trunks.page(pageQuery(options));
  const items = await Promise.all(
    page.instances.map((trunk) =>
      readTrunkRecord(client, trunk as unknown as TrunkInstance),
    ),
  );
  return pageResult(items, page.nextPageUrl, options.fields);
}

export async function listOrigination(
  client: Twilio.Twilio,
  trunkSid: string,
): Promise<OriginationView[]> {
  const urls = await client.trunking.v1
    .trunks(trunkSid)
    .originationUrls.list({ limit: 1000 });
  return urls.map(mapOrigination);
}

export function mapCallPage(
  calls: CallInstance[],
  nextPageUrl: string | undefined,
  fields: string[] | undefined,
): { items: CallView[]; has_more: boolean; pagination_key?: string } {
  return pageResult(calls.map(mapCall), nextPageUrl, fields);
}
