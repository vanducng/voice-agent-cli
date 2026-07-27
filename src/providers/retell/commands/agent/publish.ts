/**
 * Agent Publish Command
 *
 * Publishes an agent's draft version to production.
 * This increments the version number and makes the draft changes live.
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import { parsePositiveIntegerFlag } from "../../../../core/numeric-flag";
import { findNewestUnpublishedVersion } from "../../../../core/version-selection";

export interface PublishAgentOptions {
  version?: string;
  description?: string;
}

/**
 * Publish an agent's draft version to production
 *
 * Publishes the current draft version of an agent, making all pending changes
 * (prompts, configuration, etc.) live in production. The version number is
 * incremented and a new draft version is created for future edits.
 *
 * @param agentId The unique agent ID to publish
 *
 * @throws {AuthenticationError} If the API key is invalid or missing
 * @throws {NotFoundError} If the agent with the specified ID doesn't exist
 * @throws {BadRequestError} If the agent ID format is invalid
 * @throws {APIConnectionError} If there's a network error connecting to the API
 * @throws {RateLimitError} If the API rate limit is exceeded
 * @throws {APIError} For other API-related errors
 *
 * @example
 * // Publish an agent
 * await publishAgentCommand('agent-123abc');
 */
export async function publishAgentCommand(
  agentId: string,
  options: PublishAgentOptions = {},
): Promise<void> {
  try {
    const client = getRetellClient();
    const publishedVersion =
      options.version !== undefined
        ? parsePositiveIntegerFlag(options.version, "--version")
        : findNewestUnpublishedVersion(
            await client.agent.getVersions(agentId),
            "agent",
          );

    await client.agent.publish(agentId, {
      version: publishedVersion,
      ...(options.description
        ? { version_description: options.description }
        : {}),
    });

    outputSuccess({
      message: "Agent published successfully",
      agent_id: agentId,
      version: publishedVersion,
      operation: "publish",
    });
  } catch (error) {
    handleSdkError(error);
  }
}
