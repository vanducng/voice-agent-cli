import type Twilio from "twilio";
import { redactSecrets } from "./errors";
import { emptyToNull, isoTimestamp, pageQuery, pageResult } from "./query";

export interface AlertView {
  sid: string;
  error_code: string | null;
  log_level: string | null;
  resource_sid: string | null;
  request_url: string | null;
  date_generated: string | null;
  alert_text?: string | null;
  more_info?: string | null;
}

export interface RecordingView {
  sid: string;
  call_sid: string | null;
  status: string | null;
  duration: string | null;
  channels: number | null;
  source: string | null;
  start_time: string | null;
  error_code: string | null;
}

export interface CallEventView {
  request: string | null;
  response: string | null;
}

export const ALERT_FIELDS = [
  "sid",
  "error_code",
  "log_level",
  "resource_sid",
  "request_url",
  "date_generated",
  "alert_text",
  "more_info",
] as const;

export const RECORDING_FIELDS = [
  "sid",
  "call_sid",
  "status",
  "duration",
  "channels",
  "source",
  "start_time",
  "error_code",
] as const;

export const CALL_EVENT_FIELDS = ["request", "response"] as const;

type AlertInstance = {
  sid: string;
  errorCode?: string | number | null;
  logLevel?: string;
  resourceSid?: string;
  requestUrl?: string;
  dateGenerated?: Date | string | null;
  alertText?: string;
  moreInfo?: string;
};

function scalar(value: string | number | null | undefined): string | null {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

export function mapAlert(alert: AlertInstance, detailed: boolean): AlertView {
  const view: AlertView = {
    sid: alert.sid,
    error_code: scalar(alert.errorCode),
    log_level: emptyToNull(alert.logLevel),
    resource_sid: emptyToNull(alert.resourceSid),
    request_url: emptyToNull(alert.requestUrl),
    date_generated: isoTimestamp(alert.dateGenerated),
  };
  if (detailed) {
    view.alert_text = alert.alertText ? redactSecrets(alert.alertText) : null;
    view.more_info = emptyToNull(alert.moreInfo);
  }
  return view;
}

export async function listAlerts(
  client: Twilio.Twilio,
  options: {
    logLevel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: string;
    paginationKey?: string;
    fields?: string[];
  },
): Promise<{ items: AlertView[]; has_more: boolean; pagination_key?: string }> {
  const page = await client.monitor.v1.alerts.page({
    logLevel: options.logLevel,
    startDate: options.startDate,
    endDate: options.endDate,
    ...pageQuery(options),
  });
  return pageResult(
    page.instances.map((alert) => mapAlert(alert, false)),
    page.nextPageUrl,
    options.fields,
  );
}

type RecordingInstance = {
  sid: string;
  callSid?: string;
  status?: string;
  duration?: string;
  channels?: number;
  source?: string;
  startTime?: Date | string | null;
  errorCode?: number | string | null;
};

export function mapRecording(recording: RecordingInstance): RecordingView {
  return {
    sid: recording.sid,
    call_sid: emptyToNull(recording.callSid),
    status: emptyToNull(recording.status),
    duration: emptyToNull(recording.duration),
    channels: recording.channels ?? null,
    source: emptyToNull(recording.source),
    start_time: isoTimestamp(recording.startTime),
    error_code: scalar(recording.errorCode),
  };
}

export async function listRecordings(
  client: Twilio.Twilio,
  options: {
    callSid?: string;
    dateCreatedAfter?: Date;
    dateCreatedBefore?: Date;
    limit?: string;
    paginationKey?: string;
    fields?: string[];
  },
): Promise<{
  items: RecordingView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.recordings.page({
    callSid: options.callSid,
    dateCreatedAfter: options.dateCreatedAfter,
    dateCreatedBefore: options.dateCreatedBefore,
    ...pageQuery(options),
  });
  return pageResult(
    page.instances.map(mapRecording),
    page.nextPageUrl,
    options.fields,
  );
}

export function mapCallEvent(event: {
  request?: unknown;
  response?: unknown;
}): CallEventView {
  return {
    request: summarize(event.request),
    response: summarize(event.response),
  };
}

function summarize(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return redactSecrets(text);
}

export async function listCallEvents(
  client: Twilio.Twilio,
  callSid: string,
  options: { limit?: string; paginationKey?: string; fields?: string[] },
): Promise<{
  items: CallEventView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.calls(callSid).events.page(pageQuery(options));
  return pageResult(
    page.instances.map(mapCallEvent),
    page.nextPageUrl,
    options.fields,
  );
}
