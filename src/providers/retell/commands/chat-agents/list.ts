/**
 * Chat Agents List Command
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
import { parseNumericFlag } from "../../../../core/numeric-flag";
import type { ChatAgentListParams } from "retell-sdk/resources/chat-agent";

const CHAT_AGENT_FILTER: Pick<ChatAgentListParams, "filter_criteria"> = {
  filter_criteria: {
    channel: {
      op: "eq" as const,
      type: "string" as const,
      value: "chat" as const,
    },
  },
};

export interface ListChatAgentsOptions {
  limit?: string;
  paginationKey?: string;
  fields?: string;
}

export async function listChatAgentsCommand(
  options: ListChatAgentsOptions = {},
): Promise<void> {
  try {
    const query: ChatAgentListParams = { ...CHAT_AGENT_FILTER };
    if (options.limit !== undefined) {
      query.limit = parseNumericFlag(options.limit, "--limit");
    }
    if (options.paginationKey) query.pagination_key = options.paginationKey;

    const client = getRetellClient();
    const response = await client.chatAgent.list(query);

    const chatAgents = getPaginatedItems(
      response,
      "Unexpected chat agents list response: POST /v2/list-agents must return items[].",
    );
    const items = options.fields
      ? filterFields(
          chatAgents,
          options.fields.split(",").map((f) => f.trim()),
        )
      : chatAgents;

    outputJson(withPaginationMetadata(response, items));
  } catch (error) {
    handleSdkError(error);
  }
}
