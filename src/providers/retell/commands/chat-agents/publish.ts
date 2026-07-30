/**
 * Chat Agents Publish Command
 *
 * Publishes the draft configuration of a chat agent (makes it live).
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import { parseNonNegativeIntegerFlag } from "../../../../core/numeric-flag";
import { findNewestUnpublishedVersion } from "../../../../core/version-selection";

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
            await client.chatAgent.getVersions(agentId),
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
      const versions = await client.chatAgent
        .getVersions(agentId)
        .catch(() => []);
      reconciled = versions.some(
        (candidate) =>
          candidate.version === version && candidate.is_published === true,
      );
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
