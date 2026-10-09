import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import * as os from "os";
import { z } from "zod";
import {
  ProviderConfigDocumentError,
  withProvider,
} from "../../../core/provider-config-document";

const CONFIG_FILE_PERMISSIONS = 0o600;
const SID_PATTERN = /^[A-Z]{2}[0-9a-fA-F]{32}$/;

const TwilioFileSchema = z.object({
  accountSid: z.string(),
  authToken: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  defaultFormat: z.enum(["json", "text"]).default("json"),
});

export interface TwilioCredentials {
  accountSid: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
  defaultFormat: "json" | "text";
}

export type ConfigScope = "local" | "global";

export interface ConfigPathOptions {
  cwd?: string;
  homeDir?: string;
  xdgConfigHome?: string;
  scope?: ConfigScope;
}

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "ConfigError";
  }
}

const ENV_NAMES = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_API_KEY",
  "TWILIO_API_SECRET",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveCwd(options: ConfigPathOptions): string {
  return options.cwd ?? process.cwd();
}

function resolveHomeDir(options: ConfigPathOptions): string {
  return options.homeDir ?? os.homedir();
}

function resolveXdgConfigHome(options: ConfigPathOptions): string {
  return (
    options.xdgConfigHome ||
    process.env.XDG_CONFIG_HOME ||
    join(resolveHomeDir(options), ".config")
  );
}

export function getLocalConfigFilePath(
  options: ConfigPathOptions = {},
): string {
  return join(resolveCwd(options), ".voice-agent.json");
}

export function getXdgConfigFilePath(options: ConfigPathOptions = {}): string {
  return join(resolveXdgConfigHome(options), "voice-agent", "config.json");
}

export function getConfigSearchPaths(
  options: ConfigPathOptions = {},
): string[] {
  return [getLocalConfigFilePath(options), getXdgConfigFilePath(options)];
}

function getConfigPathForScope(options: ConfigPathOptions = {}): string {
  return options.scope === "local"
    ? getLocalConfigFilePath(options)
    : getXdgConfigFilePath(options);
}

function envValue(name: (typeof ENV_NAMES)[number]): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

export function twilioEnvPresent(): boolean {
  return ENV_NAMES.some((name) => envValue(name) !== undefined);
}

function assertSid(value: string, prefix: string, label: string): void {
  if (!value.startsWith(prefix) || !SID_PATTERN.test(value)) {
    throw new ConfigError(`${label} is invalid.`, "INVALID_CONFIG");
  }
}

function assertSecret(value: string | undefined, label: string): void {
  if (!value || value.length < 16) {
    throw new ConfigError(`${label} is invalid.`, "INVALID_CONFIG");
  }
}

export function validateTwilioCredentials(
  input: TwilioCredentials,
  path?: string,
): TwilioCredentials {
  const where = path ? ` in ${path}` : "";
  try {
    assertSid(input.accountSid, "AC", `Twilio account SID${where}`);
  } catch (error) {
    if (path && error instanceof ConfigError) {
      throw new ConfigError(
        `Twilio account SID in ${path} is invalid.`,
        error.code,
      );
    }
    throw error;
  }

  const hasToken = input.authToken !== undefined;
  const hasKey = input.apiKey !== undefined || input.apiSecret !== undefined;
  if (hasToken && hasKey) {
    throw new ConfigError(
      path
        ? `Twilio config at ${path} must use either an auth token or an API key, not both.`
        : "Set either TWILIO_AUTH_TOKEN or TWILIO_API_KEY with TWILIO_API_SECRET, not both.",
      "CONFLICTING_CREDENTIALS",
    );
  }
  if (hasToken) {
    assertSecret(
      input.authToken,
      path ? `Twilio auth token in ${path}` : "Twilio auth token",
    );
    return {
      accountSid: input.accountSid,
      authToken: input.authToken,
      defaultFormat: input.defaultFormat,
    };
  }
  if (input.apiKey && input.apiSecret) {
    assertSid(
      input.apiKey,
      "SK",
      path ? `Twilio API key in ${path}` : "Twilio API key",
    );
    assertSecret(
      input.apiSecret,
      path ? `Twilio API secret in ${path}` : "Twilio API secret",
    );
    return {
      accountSid: input.accountSid,
      apiKey: input.apiKey,
      apiSecret: input.apiSecret,
      defaultFormat: input.defaultFormat,
    };
  }
  throw new ConfigError(
    path
      ? `Twilio config at ${path} needs an auth token or an API key and secret.`
      : "Twilio environment credentials are incomplete.",
    path ? "INVALID_CONFIG" : "AUTH_ERROR",
  );
}

function credentialsFromEnv(): TwilioCredentials {
  const accountSid = envValue("TWILIO_ACCOUNT_SID");
  const authToken = envValue("TWILIO_AUTH_TOKEN");
  const apiKey = envValue("TWILIO_API_KEY");
  const apiSecret = envValue("TWILIO_API_SECRET");
  if (!accountSid) {
    throw new ConfigError(
      "TWILIO_ACCOUNT_SID is required when Twilio environment credentials are set.",
      "AUTH_ERROR",
    );
  }
  return validateTwilioCredentials({
    accountSid,
    authToken,
    apiKey,
    apiSecret,
    defaultFormat: "json",
  });
}

function readTwilioConfig(configPath: string): TwilioCredentials | null {
  if (!existsSync(configPath)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(
        `Config file contains invalid JSON at ${configPath}`,
        "INVALID_JSON",
      );
    }
    throw error;
  }

  if (!isRecord(parsed) || !isRecord(parsed.providers)) {
    return null;
  }
  if (!("twilio" in parsed.providers)) return null;

  const candidate = TwilioFileSchema.safeParse(parsed.providers.twilio);
  if (!candidate.success) {
    throw new ConfigError(
      `Invalid Twilio config at ${configPath}.`,
      "INVALID_CONFIG",
    );
  }
  return validateTwilioCredentials(
    {
      accountSid: candidate.data.accountSid,
      authToken: candidate.data.authToken,
      apiKey: candidate.data.apiKey,
      apiSecret: candidate.data.apiSecret,
      defaultFormat: candidate.data.defaultFormat,
    },
    configPath,
  );
}

export function getTwilioCredentials(
  options: ConfigPathOptions = {},
): TwilioCredentials {
  if (twilioEnvPresent()) return credentialsFromEnv();

  for (const configPath of getConfigSearchPaths(options)) {
    const config = readTwilioConfig(configPath);
    if (config) return config;
  }

  throw new ConfigError(
    `No Twilio configuration found. Run \`vac twilio login\` or set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN. Checked: ${getConfigSearchPaths(options).join(", ")}`,
    "NO_CONFIG",
  );
}

export function saveTwilioConfig(
  config: TwilioCredentials,
  options: ConfigPathOptions = { scope: "global" },
): string {
  const providerConfig = validateTwilioCredentials(config);
  const configPath = getConfigPathForScope(options);
  try {
    const document = withProvider(configPath, "twilio", providerConfig);
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(document, null, 2), {
      encoding: "utf-8",
      mode: CONFIG_FILE_PERMISSIONS,
    });
    chmodSync(configPath, CONFIG_FILE_PERMISSIONS);
    return configPath;
  } catch (error) {
    if (error instanceof ProviderConfigDocumentError) {
      throw new ConfigError(error.message, error.code);
    }
    if (error instanceof ConfigError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`Failed to save config: ${message}`, "WRITE_ERROR");
  }
}

export function configFileExists(options: ConfigPathOptions = {}): boolean {
  return existsSync(getConfigPathForScope(options));
}

export function getConfigFilePath(options: ConfigPathOptions = {}): string {
  return getConfigPathForScope(options);
}
