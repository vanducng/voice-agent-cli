import type { LlmCreateParams } from "retell-sdk/resources/llm";

type ModelConfig = NonNullable<LlmCreateParams["model_config"]>;
type CascadingModel = LlmCreateParams.CascadingModelConfig.Primary["model"];
type S2SModel = LlmCreateParams.S2SModelConfig.Primary["model"];

const LEGACY_MODEL_FIELDS = [
  "model",
  "s2s_model",
  "model_high_priority",
  "model_ultrafast",
  "model_temperature",
  "backup_model",
];

export function modelConfigFromFlags(
  model?: string,
  s2sModel?: string,
): ModelConfig | undefined {
  if (model && s2sModel)
    throwValidation("--model and --s2s-model are mutually exclusive.");
  if (model)
    return { type: "cascading", primary: { model: model as CascadingModel } };
  if (s2sModel)
    return { type: "s2s", primary: { model: s2sModel as S2SModel } };
  return undefined;
}

export function rejectLegacyModelFields(
  body: Record<string, unknown>,
  flagName: string,
): void {
  const legacy = LEGACY_MODEL_FIELDS.filter((field) => field in body);
  if (legacy.length > 0)
    throwValidation(
      `${flagName} uses deprecated ${legacy.join(", ")}. Move model settings into model_config (primary, backup, temperature).`,
    );
}

export function throwValidation(message: string): never {
  const err = new Error(message);
  err.name = "ValidationError";
  throw err;
}
