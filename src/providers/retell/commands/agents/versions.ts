import { parsePositiveIntegerFlag } from "../../../../core/numeric-flag";
import {
  getPaginatedItems,
  withPaginationMetadata,
} from "../../../../core/paginated-response";
import { AGENT_VERSIONS_CONTRACT } from "../../services/agent-versions";
import {
  filterFields,
  handleSdkError,
  outputJson,
} from "../../services/output-formatter";
import { getRetellClient } from "../../services/retell-client";
import type { AgentListVersionsParams } from "retell-sdk/resources/agent";

export interface AgentVersionsOptions {
  limit?: string;
  paginationKey?: string;
  fields?: string;
}

export async function agentVersionsCommand(
  agentId: string,
  options: AgentVersionsOptions = {},
): Promise<void> {
  try {
    const query: AgentListVersionsParams = {};
    if (options.limit !== undefined) {
      query.limit = parsePositiveIntegerFlag(options.limit, "--limit");
    }
    if (options.paginationKey) {
      query.pagination_key = options.paginationKey;
    }

    const response = await getRetellClient().agent.listVersions(agentId, query);
    const versions = getPaginatedItems(response, AGENT_VERSIONS_CONTRACT);
    const items = options.fields
      ? filterFields(
          versions,
          options.fields.split(",").map((field) => field.trim()),
        )
      : versions;

    outputJson(withPaginationMetadata(response, items));
  } catch (error) {
    handleSdkError(error);
  }
}
