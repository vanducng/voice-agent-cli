import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import { parseNonNegativeIntegerFlag } from "../../../../core/numeric-flag";

export interface DeleteChatAgentVersionOptions {
  version: string;
}

export async function deleteChatAgentVersionCommand(
  agentId: string,
  options: DeleteChatAgentVersionOptions,
): Promise<void> {
  try {
    const version = parseNonNegativeIntegerFlag(options.version, "--version");
    const client = getRetellClient();
    await client.chatAgent.deleteVersion(agentId, { version });

    outputSuccess({
      message: "Chat agent version deleted successfully",
      agent_id: agentId,
      version,
      operation: "delete-version",
    });
  } catch (error) {
    handleSdkError(error);
  }
}
