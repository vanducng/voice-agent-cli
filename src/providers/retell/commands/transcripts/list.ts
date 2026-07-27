/**
 * List Calls Command
 *
 * Lists all call transcripts with optional filtering and pagination.
 * Usage: vac retell transcripts list [--limit <number>]
 */

import { getRetellClient } from "../../services/retell-client";
import {
  outputJson,
  handleSdkError,
  filterFields,
} from "../../services/output-formatter";
import {
  getPaginatedItems,
  withPaginationMetadata,
} from "../../../../core/paginated-response";
import type { CallListParams } from "retell-sdk/resources/call";

// ===== TYPES =====

export interface ListTranscriptsOptions {
  limit?: number;
  paginationKey?: string;
  fields?: string;
}

// ===== COMMAND IMPLEMENTATION =====

/**
 * List all call transcripts
 *
 * @param options Command options (limit)
 */
export async function listTranscriptsCommand(
  options: ListTranscriptsOptions,
): Promise<void> {
  try {
    const client = getRetellClient();

    // Call the SDK to list calls
    const query: CallListParams = {
      limit: options.limit || 50,
    };
    if (options.paginationKey) query.pagination_key = options.paginationKey;

    const response = await client.call.list(query);
    const calls = getPaginatedItems(response);

    // Apply field filtering if requested
    const output = options.fields
      ? filterFields(
          calls,
          options.fields.split(",").map((f) => f.trim()),
        )
      : calls;

    // Output as JSON
    outputJson(withPaginationMetadata(response, output));
  } catch (error) {
    handleSdkError(error);
  }
}
