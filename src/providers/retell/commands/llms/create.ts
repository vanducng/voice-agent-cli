/**
 * LLMs Create Command
 *
 * Creates a new Retell LLM response engine.
 * Usage: vac retell llms create [--file <path>] [--general-prompt <str>] [options]
 */

import { getRetellClient } from "../../services/retell-client";
import {
  outputJson,
  handleSdkError,
  filterFields,
} from "../../services/output-formatter";
import { readJsonObjectFile } from "../../../../core/json-arg";
import type { LlmCreateParams } from "retell-sdk/resources/llm";
import {
  modelConfigFromFlags,
  rejectLegacyModelFields,
  throwValidation,
} from "./model-config";

export interface CreateLlmOptions {
  file?: string;
  generalPrompt?: string;
  model?: string;
  s2sModel?: string;
  startSpeaker?: string;
  beginMessage?: string;
  fields?: string;
}

export async function createLlmCommand(
  options: CreateLlmOptions = {},
): Promise<void> {
  try {
    let params: LlmCreateParams;

    if (options.file) {
      const simpleFlags = [
        options.generalPrompt !== undefined && "--general-prompt",
        options.model !== undefined && "--model",
        options.s2sModel !== undefined && "--s2s-model",
        options.startSpeaker !== undefined && "--start-speaker",
        options.beginMessage !== undefined && "--begin-message",
      ].filter(Boolean);
      if (simpleFlags.length > 0) {
        throwValidation(
          `--file is mutually exclusive with ${simpleFlags.join(", ")}. Put all fields in the JSON body.`,
        );
      }
      const body = readJsonObjectFile(options.file, "--file");
      rejectLegacyModelFields(body, "--file");
      params = body as unknown as LlmCreateParams;
    } else {
      params = {};
      if (options.generalPrompt !== undefined)
        params.general_prompt = options.generalPrompt;
      const modelConfig = modelConfigFromFlags(options.model, options.s2sModel);
      if (modelConfig) params.model_config = modelConfig;
      if (options.startSpeaker) {
        if (!["user", "agent"].includes(options.startSpeaker))
          throwValidation("--start-speaker must be 'user' or 'agent'");
        params.start_speaker = options.startSpeaker as "user" | "agent";
      }
      if (options.beginMessage !== undefined)
        params.begin_message = options.beginMessage;
    }

    const client = getRetellClient();
    const llm = await client.llm.create(params);

    const output = options.fields
      ? filterFields(
          llm,
          options.fields.split(",").map((f) => f.trim()),
        )
      : llm;

    outputJson(output);
  } catch (error) {
    handleSdkError(error);
  }
}
