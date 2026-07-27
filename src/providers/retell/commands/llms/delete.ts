/**
 * LLMs Delete Command
 *
 * Deletes a Retell LLM.
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";

export async function deleteLlmCommand(llmId: string): Promise<void> {
  try {
    const client = getRetellClient();
    await client.llm.delete(llmId);

    outputSuccess({
      message: "LLM deleted successfully",
      llm_id: llmId,
      operation: "delete",
    });
  } catch (error) {
    handleSdkError(error);
  }
}
