/**
 * Agent Delete Command
 *
 * Deletes an agent by ID.
 * Usage: vac retell agents delete <agent_id>
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";

/**
 * Delete an agent
 *
 * @param agentId The agent ID to delete
 */
export async function deleteAgentCommand(agentId: string): Promise<void> {
  try {
    const client = getRetellClient();

    // Delete the agent
    await client.agent.delete(agentId);

    outputSuccess({
      message: "Agent deleted successfully",
      agent_id: agentId,
      operation: "delete",
    });
  } catch (error) {
    handleSdkError(error);
  }
}
