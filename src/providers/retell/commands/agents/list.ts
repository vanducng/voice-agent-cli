import { getRetellClient } from "../../services/retell-client";
import {
  outputJson,
  handleSdkError,
  filterFields,
} from "../../services/output-formatter";
import {
  normalizeListResponse,
  withPaginationMetadata,
} from "../../../../core/paginated-response";
import type { AgentListParams } from "retell-sdk/resources/agent";

export interface ListAgentsOptions {
  limit?: number;
  paginationKey?: string;
  fields?: string;
}

const VOICE_AGENT_FILTER: Pick<AgentListParams, "filter_criteria"> = {
  filter_criteria: {
    channel: {
      op: "eq" as const,
      type: "string" as const,
      value: "voice" as const,
    },
  },
};

export function normalizeAgentsResponse(response: unknown): unknown[] {
  return normalizeListResponse(
    response,
    "Unexpected agents list response shape: expected array, agents[], data[], items[], or results[]",
    ["agents", "data", "items", "results"],
  );
}

export async function listAgentsCommand(
  options: ListAgentsOptions = {},
): Promise<void> {
  try {
    const client = getRetellClient();

    const response = await client.agent.list({
      limit: options.limit || 100,
      ...(options.paginationKey
        ? { pagination_key: options.paginationKey }
        : {}),
      ...VOICE_AGENT_FILTER,
    });
    const agents = normalizeAgentsResponse(response);
    const items = options.fields
      ? filterFields(
          agents,
          options.fields.split(",").map((f) => f.trim()),
        )
      : agents;

    outputJson(withPaginationMetadata(response, items));
  } catch (error) {
    handleSdkError(error);
  }
}
