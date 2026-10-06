import { getRetellClient } from "../../services/retell-client";

export interface AgentTag {
  version?: number | null;
  dynamic_variables?: Record<string, unknown>;
}

export interface AgentRoot {
  agent_id: string;
  tags: Record<string, AgentTag>;
}

export interface AgentRootSnapshot {
  root: AgentRoot;
  etag: string | null;
}

export function throwValidation(message: string): never {
  const error = new Error(message);
  error.name = "ValidationError";
  throw error;
}

export function updateAgentRootPath(agentId: string): string {
  return `/update-agent-root/${encodeURIComponent(agentId)}`;
}

export function presentTag(value: AgentTag) {
  return {
    ...value,
    version: value.version ?? null,
    dynamic_variables: value.dynamic_variables ?? {},
  };
}

export async function getAgentRoot(
  agentId: string,
): Promise<AgentRootSnapshot> {
  const { data, response } = await getRetellClient()
    .get(`/get-agent-root/${encodeURIComponent(agentId)}`)
    .withResponse();
  const root = data as AgentRoot;
  if (
    !root ||
    typeof root.agent_id !== "string" ||
    typeof root.tags !== "object" ||
    root.tags === null ||
    Array.isArray(root.tags) ||
    Object.values(root.tags).some(
      (tag) => typeof tag !== "object" || tag === null || Array.isArray(tag),
    )
  ) {
    throw new Error("Retell returned an invalid agent root response");
  }
  return { root, etag: response.headers.get("etag") };
}

export function getExistingTag(root: AgentRoot, tag: string): AgentTag {
  if (!Object.hasOwn(root.tags, tag)) {
    throwValidation(`Tag '${tag}' does not exist on agent ${root.agent_id}`);
  }
  return root.tags[tag];
}

export function tagMap(
  tags: Record<string, AgentTag>,
  name: string,
  version: number | null,
  variables: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(tags).map(([tagName, value]) => [
      tagName,
      {
        version: tagName === name ? version : (value.version ?? null),
        dynamic_variables:
          tagName === name ? variables : (value.dynamic_variables ?? {}),
      },
    ]),
  );
}
