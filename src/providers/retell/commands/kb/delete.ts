/**
 * Knowledge Base Delete Command
 *
 * Deletes a knowledge base by ID.
 * Usage: vac retell kb delete <knowledge_base_id>
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import type { KnowledgeBaseMutationOutput } from "../../types/kb";

/**
 * Delete a knowledge base
 *
 * @param knowledgeBaseId The knowledge base ID to delete
 */
export async function deleteKnowledgeBaseCommand(
  knowledgeBaseId: string,
): Promise<void> {
  try {
    const client = getRetellClient();

    // Delete the knowledge base
    await client.knowledgeBase.delete(knowledgeBaseId);

    const output: KnowledgeBaseMutationOutput = {
      message: "Knowledge base deleted successfully",
      knowledge_base_id: knowledgeBaseId,
      operation: "delete",
    };

    outputSuccess(output);
  } catch (error) {
    handleSdkError(error);
  }
}
