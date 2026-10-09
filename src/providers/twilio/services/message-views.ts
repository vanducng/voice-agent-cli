import type Twilio from "twilio";
import { emptyToNull, isoTimestamp, pageQuery, pageResult } from "./query";

export interface MessageView {
  sid: string;
  to: string | null;
  from: string | null;
  status: string | null;
  direction: string | null;
  error_code: string | null;
  error_message: string | null;
  messaging_service_sid: string | null;
  num_segments: string | null;
  date_sent: string | null;
  date_created: string | null;
  body?: string | null;
}

export interface ServiceNumberView {
  sid: string;
  phone_number: string | null;
}

export interface ServiceView {
  sid: string;
  friendly_name: string | null;
  usecase: string | null;
  inbound_request_url: string | null;
  status_callback: string | null;
  phone_numbers?: ServiceNumberView[];
}

export const MESSAGE_FIELDS = [
  "sid",
  "to",
  "from",
  "status",
  "direction",
  "error_code",
  "error_message",
  "messaging_service_sid",
  "num_segments",
  "date_sent",
  "date_created",
  "body",
] as const;

export const SERVICE_FIELDS = [
  "sid",
  "friendly_name",
  "usecase",
  "inbound_request_url",
  "status_callback",
  "phone_numbers",
] as const;

type MessageInstance = {
  sid: string;
  to?: string;
  from?: string;
  body?: string;
  status?: string;
  direction?: string;
  errorCode?: number | string | null;
  errorMessage?: string;
  messagingServiceSid?: string;
  numSegments?: string;
  dateSent?: Date | string | null;
  dateCreated?: Date | string | null;
};

function scalar(value: number | string | null | undefined): string | null {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

export function mapMessage(
  message: MessageInstance,
  includeBody: boolean,
): MessageView {
  const view: MessageView = {
    sid: message.sid,
    to: emptyToNull(message.to),
    from: emptyToNull(message.from),
    status: emptyToNull(message.status),
    direction: emptyToNull(message.direction),
    error_code: scalar(message.errorCode),
    error_message: emptyToNull(message.errorMessage),
    messaging_service_sid: emptyToNull(message.messagingServiceSid),
    num_segments: emptyToNull(message.numSegments),
    date_sent: isoTimestamp(message.dateSent),
    date_created: isoTimestamp(message.dateCreated),
  };
  if (includeBody) view.body = message.body ?? null;
  return view;
}

export async function listMessages(
  client: Twilio.Twilio,
  options: {
    to?: string;
    from?: string;
    dateSentAfter?: Date;
    dateSentBefore?: Date;
    limit?: string;
    paginationKey?: string;
    fields?: string[];
    includeBody?: boolean;
  },
): Promise<{
  items: MessageView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.messages.page({
    to: options.to,
    from: options.from,
    dateSentAfter: options.dateSentAfter,
    dateSentBefore: options.dateSentBefore,
    ...pageQuery(options),
  });
  return pageResult(
    page.instances.map((message) =>
      mapMessage(message, options.includeBody === true),
    ),
    page.nextPageUrl,
    options.fields,
  );
}

type ServiceInstance = {
  sid: string;
  friendlyName?: string;
  usecase?: string;
  inboundRequestUrl?: string;
  statusCallback?: string;
};

export function mapService(
  service: ServiceInstance,
  phoneNumbers?: ServiceNumberView[],
): ServiceView {
  return {
    sid: service.sid,
    friendly_name: emptyToNull(service.friendlyName),
    usecase: emptyToNull(service.usecase),
    inbound_request_url: emptyToNull(service.inboundRequestUrl),
    status_callback: emptyToNull(service.statusCallback),
    ...(phoneNumbers ? { phone_numbers: phoneNumbers } : {}),
  };
}

export async function listServices(
  client: Twilio.Twilio,
  options: { limit?: string; paginationKey?: string; fields?: string[] },
): Promise<{
  items: ServiceView[];
  has_more: boolean;
  pagination_key?: string;
}> {
  const page = await client.messaging.v1.services.page(pageQuery(options));
  return pageResult(
    page.instances.map((service) => mapService(service)),
    page.nextPageUrl,
    options.fields,
  );
}
