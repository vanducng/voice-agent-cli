/**
 * Chat Agents Publish Command
 *
 * Publishes the draft configuration of a chat agent (makes it live).
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import { parseNonNegativeIntegerFlag } from "../../../../core/numeric-flag";
import { findNewestUnpublishedVersion } from "../../../../core/version-selection";
import { listAllAgentVersions } from "../../services/agent-versions";

export interface PublishChatAgentOptions {
  version?: string;
  description?: string;
}

export async function publishChatAgentCommand(
  agentId: string,
  options: PublishChatAgentOptions = {},
): Promise<void> {
  try {
    const client = getRetellClient();
    const version =
      options.version !== undefined
        ? parseNonNegativeIntegerFlag(options.version, "--version")
        : findNewestUnpublishedVersion(
            await listAllAgentVersions(client, agentId),
            "chat agent",
          );

    let reconciled = false;
    try {
      await client.chatAgent.publish(agentId, {
        version,
        ...(options.description
          ? { version_description: options.description }
          : {}),
      });
    } catch (error) {
      try {
        const snapshot = await client.chatAgent.retrieve(agentId, {
          version,
        });
        reconciled =
          snapshot.version === version && snapshot.is_published === true;
      } catch {
        reconciled = false;
      }
      if (!reconciled) {
        throw error;
      }
    }

    outputSuccess({
      message: "Chat agent published successfully",
      agent_id: agentId,
      version,
      operation: "publish",
      ...(reconciled ? { reconciled: true } : {}),
    });
  } catch (error) {
    handleSdkError(error);
  }
}
