import { requireNonEmpty } from "../../../../core/flag-guards";
import { parseNumericFlag } from "../../../../core/numeric-flag";
import { listAllAgentVersions } from "../../services/agent-versions";
import { getRetellClient } from "../../services/retell-client";
import {
  handleSdkError,
  outputError,
  outputSuccess,
} from "../../services/output-formatter";
import {
  getAgentRoot,
  getExistingTag,
  tagMap,
  throwValidation,
  updateAgentRootPath,
} from "./agent-root";
import {
  maskDynamicVariables,
  mergeTagDynamicVariables,
  resolveDynamicVariableUpdate,
  sameDynamicVariables,
  type DynamicVariableUpdate,
} from "./tag-variables";

export interface AssignAgentTagOptions {
  agentVersion?: string;
  dryRun?: boolean;
  dynamicVariables?: string;
  dynamicVariablesFile?: string;
  set?: string[];
  replace?: boolean;
}

function variablePreview(
  current: Record<string, unknown> | undefined,
  next: Record<string, unknown>,
  update: DynamicVariableUpdate | undefined,
) {
  return {
    mode:
      update === undefined ? "unchanged" : update.replace ? "replace" : "merge",
    current: maskDynamicVariables(current),
    next: maskDynamicVariables(next),
  };
}

export async function assignAgentTagCommand(
  agentId: string,
  tag: string,
  options: AssignAgentTagOptions,
): Promise<void> {
  try {
    const client = getRetellClient();
    const name = requireNonEmpty(tag, "tag");
    const update = resolveDynamicVariableUpdate(options);
    if (update === undefined && options.agentVersion === undefined) {
      throwValidation(
        "Pass --agent-version, --dynamic-variables, --dynamic-variables-file, or --set",
      );
    }

    let requestedVersion: number | undefined;
    let isPublished: boolean | undefined;
    if (options.agentVersion !== undefined) {
      const version = parseNumericFlag(options.agentVersion, "--agent-version");
      if (!Number.isSafeInteger(version) || version < 0) {
        throwValidation("--agent-version must be a non-negative safe integer");
      }
      const versions = await listAllAgentVersions(client, agentId);
      const target = versions.find(
        (candidate) => candidate.version === version,
      );
      if (!target) {
        throwValidation(
          `Version ${version} does not exist on agent ${agentId}`,
        );
      }
      requestedVersion = version;
      isPublished = target.is_published;
    }

    const initial = await getAgentRoot(agentId);
    const current = getExistingTag(initial.root, name);
    const initialNext = mergeTagDynamicVariables(
      current.dynamic_variables,
      update,
    );
    const result = {
      agent_id: initial.root.agent_id,
      tag: name,
      previous_version: current.version ?? null,
      version: requestedVersion ?? current.version ?? null,
      ...(isPublished === undefined ? {} : { is_published: isPublished }),
      dynamic_variables: variablePreview(
        current.dynamic_variables,
        initialNext,
        update,
      ),
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
    let appliedVariables: Record<string, unknown> | undefined;
    let appliedCurrent: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const snapshot = attempt === 0 ? initial : await getAgentRoot(agentId);
      const latest = getExistingTag(snapshot.root, name);
      if (!snapshot.etag) {
        throw new Error("Retell did not return an ETag for the agent root");
      }
      const version = requestedVersion ?? latest.version ?? null;
      const variables = mergeTagDynamicVariables(
        latest.dynamic_variables,
        update,
      );
      try {
        await client.patch(updateAgentRootPath(agentId), {
          body: { tags: tagMap(snapshot.root.tags, name, version, variables) },
          headers: { "If-Match": snapshot.etag },
        });
        previousVersion = latest.version ?? null;
        appliedCurrent = latest.dynamic_variables;
        appliedVariables = variables;
        break;
      } catch (error) {
        if ((error as { status?: number }).status !== 412 || attempt === 2) {
          throw error;
        }
      }
    }
    if (previousVersion === undefined || appliedVariables === undefined) {
      throw new Error("Retell tag assignment did not complete");
    }

    const { root: verified } = await getAgentRoot(agentId);
    const verifiedTag = getExistingTag(verified, name);
    const expectedVersion = requestedVersion ?? previousVersion;
    if ((verifiedTag.version ?? null) !== expectedVersion) {
      outputError(
        `Retell did not assign tag '${name}' to version ${expectedVersion}`,
        "VERIFICATION_ERROR",
        {
          retryable: true,
          nextSteps: [
            `Run 'vac retell agents tags get ${agentId} ${name}' and retry.`,
          ],
        },
      );
    }
    if (
      update &&
      !sameDynamicVariables(verifiedTag.dynamic_variables, appliedVariables)
    ) {
      outputError(
        `Retell did not update dynamic variables for tag '${name}'`,
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
      message:
        requestedVersion === undefined
          ? "Agent tag variables updated"
          : "Agent tag assigned",
      dry_run: false,
      ...result,
      previous_version: previousVersion,
      version: expectedVersion,
      dynamic_variables: variablePreview(
        appliedCurrent,
        appliedVariables,
        update,
      ),
    });
  } catch (error) {
    handleSdkError(error);
  }
}
