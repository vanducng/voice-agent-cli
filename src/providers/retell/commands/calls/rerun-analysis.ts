import type { CallResponse } from "retell-sdk/resources/call";
import { getRetellClient } from "../../services/retell-client";
import { handleSdkError, outputJson } from "../../services/output-formatter";

export async function rerunCallAnalysisCommand(callId: string): Promise<void> {
  try {
    const result = await getRetellClient().put<CallResponse>(
      `/rerun-call-analysis/${encodeURIComponent(callId)}`,
      { maxRetries: 0 },
    );
    outputJson(result);
  } catch (error) {
    handleSdkError(error);
  }
}
