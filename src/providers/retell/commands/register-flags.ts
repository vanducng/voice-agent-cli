import {
  parseNumericFlag,
  parsePositiveIntegerFlag,
} from "../../../core/numeric-flag";
import { outputError } from "../services/output-formatter";

function parseOrExit(
  parser: (value: string, flagName: string) => number,
  value: string | undefined,
  flagName: string,
): number | undefined {
  if (value === undefined) return undefined;
  try {
    return parser(value, flagName);
  } catch (error) {
    outputError((error as Error).message, "VALIDATION_ERROR");
  }
}

export function parseFlagOrExit(
  value: string | undefined,
  flagName: string,
): number | undefined {
  return parseOrExit(parseNumericFlag, value, flagName);
}

export function parsePositiveIntegerFlagOrExit(
  value: string | undefined,
  flagName: string,
): number | undefined {
  return parseOrExit(parsePositiveIntegerFlag, value, flagName);
}
