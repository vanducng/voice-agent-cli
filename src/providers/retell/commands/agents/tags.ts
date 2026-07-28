import { requireNonEmpty } from "../../../../core/flag-guards";
import { parseNumericFlag } from "../../../../core/numeric-flag";
import { getRetellClient } from "../../services/retell-client";
import {
  handleSdkError,
  outputError,
  outputJson,
  outputSuccess,
} from "../../services/output-formatter";

interface AgentTag {
  version?: number | null;
  dynamic_variables?: Record<string, unknown>;
}

interface AgentRoot {
  agent_id: string;
  tags: Record<string, AgentTag>;
}

interface AgentRootSnapshot {
  root: AgentRoot;
  etag: string | null;
}

export interface AssignAgentTagOptions {
  agentVersion: string;
  dryRun?: boolean;
}

function throwValidation(message: string): never {
  const error = new Error(message);
  error.name = "ValidationError";
  throw error;
}

function agentRootPath(agentId: string): string {
  return `/get-agent-root/${encodeURIComponent(agentId)}`;
}

function updateAgentRootPath(agentId: string): string {
  return `/update-agent-root/${encodeURIComponent(agentId)}`;
}

async function getAgentRoot(agentId: string): Promise<AgentRootSnapshot> {
  const { data, response } = await getRetellClient()
    .get(agentRootPath(agentId))
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

function getExistingTag(root: AgentRoot, tag: string): AgentTag {
  if (!Object.hasOwn(root.tags, tag)) {
    throwValidation(`Tag '${tag}' does not exist on agent ${root.agent_id}`);
  }
  return root.tags[tag];
}

export async function getAgentTagsCommand(
  agentId: string,
  tag?: string,
): Promise<void> {
  try {
    const { root } = await getAgentRoot(agentId);
    if (tag === undefined) {
      outputJson({
        agent_id: root.agent_id,
        tags: Object.fromEntries(
          Object.entries(root.tags).map(([name, value]) => [
            name,
            {
              ...value,
              version: value.version ?? null,
              dynamic_variables: value.dynamic_variables ?? {},
            },
          ]),
        ),
      });
      return;
    }

    const name = requireNonEmpty(tag, "tag");
    const value = getExistingTag(root, name);
    outputJson({
      agent_id: root.agent_id,
      tag: name,
      version: value.version ?? null,
      dynamic_variables: value.dynamic_variables ?? {},
    });
  } catch (error) {
    handleSdkError(error);
  }
}

export async function assignAgentTagCommand(
  agentId: string,
  tag: string,
  options: AssignAgentTagOptions,
): Promise<void> {
  try {
    const client = getRetellClient();
    const name = requireNonEmpty(tag, "tag");
    const version = parseNumericFlag(options.agentVersion, "--agent-version");
    if (!Number.isSafeInteger(version) || version < 0) {
      throwValidation("--agent-version must be a non-negative safe integer");
    }
    const versions = await client.agent.getVersions(agentId);
    const target = versions.find((candidate) => candidate.version === version);
    if (!target) {
      throwValidation(`Version ${version} does not exist on agent ${agentId}`);
    }

    const initial = await getAgentRoot(agentId);
    const root = initial.root;
    const current = getExistingTag(root, name);
    const result = {
      agent_id: root.agent_id,
      tag: name,
      previous_version: current.version ?? null,
      version,
      is_published: target.is_published,
    };

    if (options.dryRun) {
      outputSuccess({
        message: "Dry run - no changes applied",
        dry_run: true,
        ...result,
      });
      return;
    }

    let previousVersion: number | null | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = attempt === 0 ? initial : await getAgentRoot(agentId);
      const latest = getExistingTag(snapshot.root, name);
      if (!snapshot.etag) {
        throw new Error("Retell did not return an ETag for the agent root");
      }
      const tags = Object.fromEntries(
        Object.entries(snapshot.root.tags).map(([tagName, value]) => [
          tagName,
          {
            version: tagName === name ? version : (value.version ?? null),
            dynamic_variables: value.dynamic_variables ?? {},
          },
        ]),
      );
      try {
        await client.patch(updateAgentRootPath(agentId), {
          body: { tags },
          headers: { "If-Match": snapshot.etag },
        });
        previousVersion = latest.version ?? null;
        break;
      } catch (error) {
        if ((error as { status?: number }).status !== 412 || attempt === 2) {
          throw error;
        }
      }
    }
    if (previousVersion === undefined) {
      throw new Error("Retell tag assignment did not complete");
    }

    const { root: verified } = await getAgentRoot(agentId);
    if ((getExistingTag(verified, name).version ?? null) !== version) {
      outputError(
        `Retell did not assign tag '${name}' to version ${version}`,
        "VERIFICATION_ERROR",
        {
          retryable: true,
          nextSteps: [
            `Run 'vac retell agents tags get ${agentId} ${name}' and retry.`,
          ],
        },
      );
    }

    outputSuccess({
      message: "Agent tag assigned",
      dry_run: false,
      ...result,
      previous_version: previousVersion,
    });
  } catch (error) {
    handleSdkError(error);
  }
}
