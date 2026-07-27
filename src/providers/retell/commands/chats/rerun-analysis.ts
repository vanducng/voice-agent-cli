import type { ChatResponse } from "retell-sdk/resources/chat";
import { getRetellClient } from "../../services/retell-client";
import { handleSdkError, outputJson } from "../../services/output-formatter";

export async function rerunChatAnalysisCommand(chatId: string): Promise<void> {
  try {
    const result = await getRetellClient().put<ChatResponse>(
      `/rerun-chat-analysis/${encodeURIComponent(chatId)}`,
      { maxRetries: 0 },
    );
    outputJson(result);
  } catch (error) {
    handleSdkError(error);
  }
}
