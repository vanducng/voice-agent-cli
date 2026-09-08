import type Retell from "retell-sdk";
import { collectPaginatedItems } from "../../../core/paginated-response";

export const AGENT_VERSIONS_CONTRACT =
  "Unexpected agent versions response: GET /list-agent-versions must return items[].";

export function listAllAgentVersions(client: Retell, agentId: string) {
  return collectPaginatedItems(
    (pagination_key) =>
      client.agent.listVersions(agentId, {
        limit: 1000,
        ...(pagination_key ? { pagination_key } : {}),
      }),
    AGENT_VERSIONS_CONTRACT,
  );
}
