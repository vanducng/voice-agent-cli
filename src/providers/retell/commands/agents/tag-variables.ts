import { loadJsonArg, readJsonFile } from "../../../../core/json-arg";

const SECRET_KEY = /key|token|secret|password/i;
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export interface DynamicVariableUpdate {
  patch: Record<string, string>;
  replace: boolean;
}

export interface DynamicVariableInput {
  dynamicVariables?: string;
  dynamicVariablesFile?: string;
  set?: string[];
  replace?: boolean;
}

export function maskDynamicVariables(
  variables: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(variables ?? {})) {
    masked[key] = SECRET_KEY.test(key) ? "***" : value;
  }
  return masked;
}

export function mergeTagDynamicVariables(
  current: Record<string, unknown> | undefined,
  update: DynamicVariableUpdate | undefined,
): Record<string, unknown> {
  if (update === undefined) return { ...(current ?? {}) };
  if (update.replace) return { ...update.patch };
  return { ...(current ?? {}), ...update.patch };
}

export function sameDynamicVariables(
  actual: Record<string, unknown> | undefined,
  expected: Record<string, unknown>,
): boolean {
  const left = actual ?? {};
  const rightKeys = Object.keys(expected);
  if (Object.keys(left).length !== rightKeys.length) return false;
  return rightKeys.every((key) => left[key] === expected[key]);
}

export function resolveDynamicVariableUpdate(
  input: DynamicVariableInput,
): DynamicVariableUpdate | undefined {
  const hasJson = input.dynamicVariables !== undefined;
  const hasFile = input.dynamicVariablesFile !== undefined;
  const sets = input.set ?? [];
  if (!hasJson && !hasFile && sets.length === 0) {
    if (input.replace) {
      throwValidation(
        "--replace requires --dynamic-variables, --dynamic-variables-file, or --set",
      );
    }
    return undefined;
  }
  if (hasJson && hasFile) {
    throwValidation(
      "Pass only one of --dynamic-variables or --dynamic-variables-file",
    );
  }

  const fromDocument = hasJson
    ? requireStringRecord(
        loadJsonArg(input.dynamicVariables, "--dynamic-variables"),
        "--dynamic-variables",
      )
    : hasFile
      ? requireStringRecord(
          readJsonFile(
            input.dynamicVariablesFile ?? "",
            "--dynamic-variables-file",
          ),
          "--dynamic-variables-file",
        )
      : {};
  const patch = { ...fromDocument };
  for (const pair of sets) {
    const parsed = parseSetPair(pair);
    patch[parsed.key] = parsed.value;
  }
  return { patch, replace: input.replace === true };
}

function requireStringRecord(
  parsed: unknown,
  flagName: string,
): Record<string, string> {
  if (parsed === undefined) {
    throwValidation(`${flagName} must be a JSON object`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throwValidation(`${flagName} must be a JSON object`);
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    rejectUnsafeKey(key, flagName);
    if (typeof value !== "string") {
      throwValidation(`${flagName}.${key} must be a string`);
    }
    result[key] = value;
  }
  return result;
}

function parseSetPair(pair: string): { key: string; value: string } {
  const index = pair.indexOf("=");
  if (index <= 0) throwValidation("--set must be KEY=VALUE");
  const key = pair.slice(0, index);
  if (key.trim() === "" || /\s/.test(key)) {
    throwValidation("--set key must be a non-empty token without whitespace");
  }
  rejectUnsafeKey(key, "--set");
  return { key, value: pair.slice(index + 1) };
}

function rejectUnsafeKey(key: string, flagName: string): void {
  if (UNSAFE_KEYS.has(key)) {
    throwValidation(`${flagName} contains an unsafe key`);
  }
}

function throwValidation(message: string): never {
  const error = new Error(message);
  error.name = "ValidationError";
  throw error;
}
