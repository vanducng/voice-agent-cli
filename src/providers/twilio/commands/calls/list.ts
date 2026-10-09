import type { CallListInstancePageOptions } from "twilio/lib/rest/api/v2010/account/call";
import { getTwilioClient } from "../../services/client";
import { listEndpointCalls } from "../../services/call-endpoints";
import { handleTwilioError, outputJson } from "../../services/errors";
import {
  fail,
  pageQuery,
  parseCallStatus,
  parseFields,
  parseUtcIso,
} from "../../services/query";
import { CALL_FIELDS, mapCallPage } from "../../services/views";

export interface ListCallsOptions {
  from?: string;
  to?: string;
  status?: string;
  startAfter?: string;
  startBefore?: string;
  limit?: string;
  paginationKey?: string;
  fields?: string;
}

export async function listCallsCommand(
  options: ListCallsOptions = {},
): Promise<void> {
  try {
    const query: CallListInstancePageOptions = { ...pageQuery(options) };
    if (options.status) query.status = parseCallStatus(options.status);
    if (options.startAfter)
      query.startTimeAfter = parseUtcIso(options.startAfter, "--start-after");
    if (options.startBefore) {
      query.startTimeBefore = parseUtcIso(
        options.startBefore,
        "--start-before",
      );
    }
    if (
      query.startTimeAfter &&
      query.startTimeBefore &&
      query.startTimeAfter.getTime() > query.startTimeBefore.getTime()
    ) {
      fail("--start-after must be earlier than or equal to --start-before.");
    }
    const fields = parseFields(options.fields, CALL_FIELDS);
    if (options.from || options.to) {
      outputJson(
        await listEndpointCalls(getTwilioClient(), {
          from: options.from,
          to: options.to,
          status: query.status,
          startTimeAfter: query.startTimeAfter,
          startTimeBefore: query.startTimeBefore,
          limit: query.pageSize,
          paginationKey: options.paginationKey,
          fields,
        }),
      );
      return;
    }
    const page = await getTwilioClient().calls.page(query);
    outputJson(mapCallPage(page.instances, page.nextPageUrl, fields));
  } catch (error) {
    handleTwilioError(error);
  }
}
