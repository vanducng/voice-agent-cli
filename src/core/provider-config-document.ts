import { existsSync, readFileSync } from "fs";

export class ProviderConfigDocumentError extends Error {
  readonly code: "INVALID_JSON" | "INVALID_CONFIG";

  constructor(message: string, code: "INVALID_JSON" | "INVALID_CONFIG") {
    super(message);
    this.name = "ProviderConfigDocumentError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function withProvider(
  configPath: string,
  provider: string,
  value: unknown,
): { providers: Record<string, unknown> } {
  if (!existsSync(configPath)) {
    return { providers: { [provider]: value } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ProviderConfigDocumentError(
        `Config file contains invalid JSON at ${configPath}`,
        "INVALID_JSON",
      );
    }
    throw error;
  }

  if (!isRecord(parsed)) {
    throw new ProviderConfigDocumentError(
      `Invalid config file format at ${configPath}`,
      "INVALID_CONFIG",
    );
  }
  if (parsed.providers !== undefined && !isRecord(parsed.providers)) {
    throw new ProviderConfigDocumentError(
      `Invalid config file format at ${configPath}`,
      "INVALID_CONFIG",
    );
  }

  const providers = isRecord(parsed.providers) ? { ...parsed.providers } : {};
  providers[provider] = value;
  return { providers };
}
