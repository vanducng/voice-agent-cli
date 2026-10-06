import { requireNonEmpty } from "../../../../core/flag-guards";
import { handleSdkError, outputJson } from "../../services/output-formatter";
import { getAgentRoot, getExistingTag, presentTag } from "./agent-root";
import { maskDynamicVariables } from "./tag-variables";

export { assignAgentTagCommand } from "./assign-tag";
export type { AssignAgentTagOptions } from "./assign-tag";

function maskedTag(value: Parameters<typeof presentTag>[0]) {
  const presented = presentTag(value);
  return {
    ...presented,
    dynamic_variables: maskDynamicVariables(presented.dynamic_variables),
  };
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
            maskedTag(value),
          ]),
        ),
      });
      return;
    }

    const name = requireNonEmpty(tag, "tag");
    outputJson({
      agent_id: root.agent_id,
      tag: name,
      ...maskedTag(getExistingTag(root, name)),
    });
  } catch (error) {
    handleSdkError(error);
  }
}
