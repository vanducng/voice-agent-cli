import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import { parseNonNegativeIntegerFlag } from "../../../../core/numeric-flag";

export interface DeleteAgentVersionOptions {
  version: string;
}

export async function deleteAgentVersionCommand(
  agentId: string,
  options: DeleteAgentVersionOptions,
): Promise<void> {
  try {
    const version = parseNonNegativeIntegerFlag(options.version, "--version");
    const client = getRetellClient();
    await client.agent.deleteVersion(agentId, { version });

    outputSuccess({
      message: "Agent version deleted successfully",
      agent_id: agentId,
      version,
      operation: "delete-version",
    });
  } catch (error) {
    handleSdkError(error);
  }
}
