import type Twilio from "twilio";
import type { CallListInstancePageOptions } from "twilio/lib/rest/api/v2010/account/call";
import { CliFailure } from "./errors";
import { paginationFromUrl, project } from "./query";
import { mapCall, type CallView } from "./views";

const DEFAULT_PAGE_SIZE = 50;
const CURSOR_PREFIX = "cf1:";

interface CallCursor {
  pageSize: number;
  skip: number;
  pageToken: string;
}

type EndpointCall = {
  from?: string | null;
  to?: string | null;
};

export function endpointMatches(
  value: string | null | undefined,
  expected: string,
): boolean {
  if (!value) return false;
  if (value === expected) return true;
  const digits = /^\+(\d+)$/.exec(expected)?.[1];
  if (!digits) return false;
  return new RegExp(`(?:^|[\\s:<]|sip:)\\+${digits}(?=@|[;>])`, "i").test(
    value,
  );
}

function encodeCursor(cursor: CallCursor): string {
  return `${CURSOR_PREFIX}${cursor.pageSize}:${cursor.skip}:${cursor.pageToken}`;
}

function decodeCursor(key: string | undefined, pageSize: number): CallCursor {
  if (!key) return { pageSize, skip: 0, pageToken: "" };
  if (!key.startsWith(CURSOR_PREFIX)) {
    return { pageSize, skip: 0, pageToken: key };
  }
  const body = key.slice(CURSOR_PREFIX.length);
  const sizeEnd = body.indexOf(":");
  const skipEnd = body.indexOf(":", sizeEnd + 1);
  const parsedSize = Number(body.slice(0, sizeEnd));
  const skip = Number(body.slice(sizeEnd + 1, skipEnd));
  if (
    sizeEnd < 1 ||
    skipEnd < 0 ||
    !Number.isInteger(parsedSize) ||
    parsedSize < 1 ||
    parsedSize > 1000 ||
    !Number.isInteger(skip) ||
    skip < 0
  ) {
    throw new CliFailure(
      "VALIDATION_ERROR",
      "--pagination-key is not valid for this call filter.",
      false,
      ["Run the list again without --pagination-key."],
    );
  }
  return {
    pageSize: parsedSize,
    skip,
    pageToken: body.slice(skipEnd + 1),
  };
}

function matchesCall(call: EndpointCall, from?: string, to?: string): boolean {
  if (from && !endpointMatches(call.from, from)) return false;
  if (to && !endpointMatches(call.to, to)) return false;
  return true;
}

function pageOf(
  calls: Parameters<typeof mapCall>[0][],
  fields: string[] | undefined,
  next?: CallCursor,
): { items: CallView[]; has_more: boolean; pagination_key?: string } {
  return {
    items: calls.map((call) => project(mapCall(call), fields)),
    has_more: Boolean(next),
    ...(next ? { pagination_key: encodeCursor(next) } : {}),
  };
}

export async function listEndpointCalls(
  client: Twilio.Twilio,
  options: {
    from?: string;
    to?: string;
    status?: CallListInstancePageOptions["status"];
    startTimeAfter?: Date;
    startTimeBefore?: Date;
    limit?: number;
    paginationKey?: string;
    fields?: string[];
  },
): Promise<{ items: CallView[]; has_more: boolean; pagination_key?: string }> {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const cursor = decodeCursor(options.paginationKey, limit);
  const matches: Parameters<typeof mapCall>[0][] = [];
  let pageToken = cursor.pageToken;
  let skip = cursor.skip;
  const seen = new Set<string>();

  for (;;) {
    const marker = `${cursor.pageSize}:${pageToken}:${skip}`;
    if (seen.has(marker)) {
      throw new CliFailure(
        "UNEXPECTED_ERROR",
        "Twilio repeated a call page.",
        true,
        ["Retry the list command."],
      );
    }
    seen.add(marker);

    const query: CallListInstancePageOptions = {
      pageSize: cursor.pageSize,
      status: options.status,
      startTimeAfter: options.startTimeAfter,
      startTimeBefore: options.startTimeBefore,
    };
    if (pageToken) query.pageToken = pageToken;
    const page = await client.calls.page(query);
    const instances = page.instances;

    for (let index = skip; index < instances.length; index += 1) {
      const call = instances[index];
      if (!call || !matchesCall(call, options.from, options.to)) continue;
      if (matches.length < limit) {
        matches.push(call);
        continue;
      }
      return pageOf(matches, options.fields, {
        pageSize: cursor.pageSize,
        skip: index,
        pageToken,
      });
    }

    if (!page.nextPageUrl) return pageOf(matches, options.fields);
    const next = paginationFromUrl(page.nextPageUrl);
    if (!next.pagination_key) return pageOf(matches, options.fields);
    pageToken = next.pagination_key;
    skip = 0;
  }
}
