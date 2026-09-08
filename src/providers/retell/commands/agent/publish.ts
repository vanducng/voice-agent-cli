/**
 * Agent Publish Command
 *
 * Publishes an agent's draft version to production.
 */

import { getRetellClient } from "../../services/retell-client";
import { outputSuccess, handleSdkError } from "../../services/output-formatter";
import { parseNonNegativeIntegerFlag } from "../../../../core/numeric-flag";
import { findNewestUnpublishedVersion } from "../../../../core/version-selection";
import { listAllAgentVersions } from "../../services/agent-versions";

export interface PublishAgentOptions {
  version?: string;
  description?: string;
}

/**
 * Publish an agent's draft version to production
 *
 * Publishes the current draft version of an agent, making all pending changes
 * (prompts, configuration, etc.) live in production.
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
        ? parseNonNegativeIntegerFlag(options.version, "--version")
        : findNewestUnpublishedVersion(
            await listAllAgentVersions(client, agentId),
            "agent",
          );

    let reconciled = false;
    try {
      await client.agent.publish(agentId, {
        version: publishedVersion,
        ...(options.description
          ? { version_description: options.description }
          : {}),
      });
    } catch (error) {
      try {
        const snapshot = await client.agent.retrieve(agentId, {
          version: publishedVersion,
        });
        reconciled =
          snapshot.version === publishedVersion &&
          snapshot.is_published === true;
      } catch {
        reconciled = false;
      }
      if (!reconciled) {
        throw error;
      }
    }

    outputSuccess({
      message: "Agent published successfully",
      agent_id: agentId,
      version: publishedVersion,
      operation: "publish",
      ...(reconciled ? { reconciled: true } : {}),
    });
  } catch (error) {
    handleSdkError(error);
  }
}
