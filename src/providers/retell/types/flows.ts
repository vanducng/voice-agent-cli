/**
 * Conversation Flow Type Definitions for the Voice Agent Retell provider
 *
 * Type definitions for managing conversation flow response engines.
 */

// ===== CONVERSATION FLOW TYPES =====

/**
 * Who speaks first in the conversation flow
 */
export type StartSpeaker = "user" | "agent";

/**
 * Conversation flow object from the API (simplified)
 * The full schema is complex - we use this for display purposes
 */
export interface ConversationFlow {
  conversation_flow_id: string;
  version: number;
  start_speaker: StartSpeaker;
  start_node_id?: string;
  nodes?: unknown[];
  edges?: unknown[];
  global_prompt?: string;
  variables?: unknown[];
  components?: unknown[];
  tools?: unknown[];
  created_timestamp?: number;
  last_updated_timestamp?: number;
}

// ===== COMMAND INPUT TYPES =====

/**
 * Options for listing conversation flows
 */
export interface ListFlowsOptions {
  limit?: number;
  paginationKey?: string;
  sortOrder?: string;
  fields?: string;
}

/**
 * Options for getting a conversation flow
 */
export interface GetFlowOptions {
  version?: number;
  fields?: string;
}

/**
 * Options for creating a conversation flow
 */
export interface CreateFlowOptions {
  file: string;
}

/**
 * Options for updating a conversation flow
 */
export interface UpdateFlowOptions {
  file: string;
  version?: number;
}

// ===== COMMAND OUTPUT TYPES =====

/**
 * Output for conversation flow list command
 */
export interface FlowListOutput {
  flows: ConversationFlow[];
  count: number;
}

/**
 * Output for conversation flow mutation commands
 */
export interface FlowMutationOutput {
  message: string;
  conversation_flow_id: string;
  version?: number;
  operation: "create" | "update" | "delete";
}
