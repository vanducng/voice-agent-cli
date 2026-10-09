import { parsePositiveIntegerFlag } from "../../../core/numeric-flag";
import { CliFailure } from "./errors";

const SID_PREFIX = {
  account: "AC",
  apiKey: "SK",
  number: "PN",
  trunk: "TK",
  origination: "OU",
  call: "CA",
} as const;

const CALL_STATUSES = [
  "queued",
  "ringing",
  "in-progress",
  "canceled",
  "completed",
  "failed",
  "busy",
  "no-answer",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

const UTC_ISO =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export function fail(message: string): never {
  throw new CliFailure("VALIDATION_ERROR", message, false, [
    "Run the command with --help and correct the arguments.",
  ]);
}

export function sid(
  value: string,
  kind: keyof typeof SID_PREFIX,
  label: string,
): string {
  const prefix = SID_PREFIX[kind];
  if (!new RegExp(`^${prefix}[0-9a-fA-F]{32}$`).test(value)) {
    fail(`${label} must be a ${prefix} SID.`);
  }
  return value;
}

export function e164OrNumberSid(value: string): {
  sid?: string;
  phoneNumber?: string;
} {
  if (/^\+[1-9]\d{1,14}$/.test(value)) return { phoneNumber: value };
  return { sid: sid(value, "number", "Number") };
}

export function parseFields(
  fields: string | undefined,
  allowed: readonly string[],
): string[] | undefined {
  if (!fields || fields.trim() === "") return undefined;
  const parsed = fields
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  if (parsed.length === 0) return undefined;
  const unknown = parsed.filter(
    (field) =>
      !allowed.includes(field) ||
      field === "__proto__" ||
      field === "constructor" ||
      field === "prototype",
  );
  if (unknown.length > 0) {
    fail(
      `Unknown field: ${unknown.join(", ")}. Available fields: ${allowed.join(", ")}.`,
    );
  }
  return parsed;
}

export function project<T extends object>(
  item: T,
  fields: string[] | undefined,
): T {
  if (!fields) return item;
  const selected = {} as T;
  for (const field of fields) {
    selected[field as keyof T] = item[field as keyof T];
  }
  return selected;
}

export function pageQuery(options: {
  limit?: string;
  paginationKey?: string;
}): {
  pageSize?: number;
  pageToken?: string;
} {
  const query: { pageSize?: number; pageToken?: string } = {};
  if (options.limit !== undefined) {
    const pageSize = parsePositiveIntegerFlag(options.limit, "--limit");
    if (pageSize > 1000) fail("--limit must be at most 1000.");
    query.pageSize = pageSize;
  }
  if (options.paginationKey) query.pageToken = options.paginationKey;
  return query;
}

export function paginationFromUrl(nextPageUrl?: string): {
  has_more: boolean;
  pagination_key?: string;
} {
  if (!nextPageUrl) return { has_more: false };
  let token: string | null = null;
  try {
    token = new URL(nextPageUrl).searchParams.get("PageToken");
  } catch {
    token = null;
  }
  if (!token) {
    throw new CliFailure(
      "UNEXPECTED_ERROR",
      "Twilio returned another page without a PageToken.",
      false,
      [
        "Retry the list command.",
        "If it persists, report it at https://github.com/vanducng/voice-agent-cli/issues.",
      ],
    );
  }
  return { has_more: true, pagination_key: token };
}

export function pageResult<T extends object>(
  items: T[],
  nextPageUrl: string | undefined,
  fields: string[] | undefined,
): { items: T[]; has_more: boolean; pagination_key?: string } {
  const page = paginationFromUrl(nextPageUrl);
  return {
    items: items.map((item) => project(item, fields)),
    has_more: page.has_more,
    ...(page.pagination_key ? { pagination_key: page.pagination_key } : {}),
  };
}

export function parseUtcIso(value: string, flag: string): Date {
  const trimmed = value.trim();
  if (!UTC_ISO.test(trimmed)) fail(`${flag} must be a UTC ISO-8601 timestamp.`);
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) fail(`${flag} must be a real timestamp.`);
  return date;
}

export function parseCallStatus(value: string): CallStatus {
  if (!CALL_STATUSES.includes(value as CallStatus)) {
    fail(`--status must be one of: ${CALL_STATUSES.join(", ")}.`);
  }
  return value as CallStatus;
}

export function parseTrunkFlag(value: string): string | null {
  if (value.trim().toLowerCase() === "none") return null;
  return sid(value.trim(), "trunk", "--trunk");
}

export function parseSipUrl(value: string): string {
  const sipUrl = value.trim();
  if (!/^sip:/i.test(sipUrl) || /^sips:/i.test(sipUrl) || /\s/.test(sipUrl)) {
    fail("--sip-url must be a sip: URI.");
  }
  return sipUrl;
}

export function parsePriority(value: string): number {
  if (!/^\d+$/.test(value.trim()))
    fail("--priority must be an integer from 0 to 65535.");
  const priority = Number(value);
  if (priority > 65535) fail("--priority must be an integer from 0 to 65535.");
  return priority;
}

export function parseWeight(value: string): number {
  if (!/^\d+$/.test(value.trim()))
    fail("--weight must be an integer from 1 to 65535.");
  const weight = Number(value);
  if (weight < 1 || weight > 65535)
    fail("--weight must be an integer from 1 to 65535.");
  return weight;
}

export function parseEnabled(value: string | undefined): boolean {
  if (value === undefined) return true;
  if (value === "true") return true;
  if (value === "false") return false;
  fail("--enabled must be true or false.");
}

export function parseFriendlyName(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (value.length > 64) fail("--friendly-name must be at most 64 characters.");
  return value;
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

export function isoTimestamp(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
