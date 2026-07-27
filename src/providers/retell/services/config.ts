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

const ProviderConfigSchema = z.object({
  apiKey: z.string().min(1, "API key cannot be empty"),
  defaultFormat: z.enum(["json", "text"]).default("json"),
});

export const ConfigSchema = z.object({
  providers: z.object({
    retell: ProviderConfigSchema,
  }),
});

export type Config = z.infer<typeof ProviderConfigSchema>;
export type ConfigScope = "local" | "global" | "xdg";

export interface ConfigPathOptions {
  cwd?: string;
  homeDir?: string;
  xdgConfigHome?: string;
  scope?: ConfigScope;
}

const CONFIG_FILE_PERMISSIONS = 0o600;

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "ConfigError";
  }
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

export function getHomeConfigFilePath(options: ConfigPathOptions = {}): string {
  return join(resolveHomeDir(options), ".config", "voice-agent", "config.json");
}

export function getXdgConfigFilePath(options: ConfigPathOptions = {}): string {
  return join(resolveXdgConfigHome(options), "voice-agent", "config.json");
}

function getLegacyConfigPaths(options: ConfigPathOptions): string[] {
  return [
    join(resolveCwd(options), ".retellrc.json"),
    join(resolveHomeDir(options), ".retellrc.json"),
    join(resolveXdgConfigHome(options), "retell", "config.json"),
  ];
}

export function getConfigSearchPaths(
  options: ConfigPathOptions = {},
): string[] {
  return [
    getLocalConfigFilePath(options),
    getXdgConfigFilePath(options),
    ...getLegacyConfigPaths(options),
  ];
}

function getConfigPathForScope(options: ConfigPathOptions = {}): string {
  return options.scope === "local"
    ? getLocalConfigFilePath(options)
    : getXdgConfigFilePath(options);
}

function readConfigFile(configPath: string): Config | null {
  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf-8"));
    const current = ConfigSchema.safeParse(parsed);
    if (current.success) {
      return current.data.providers.retell;
    }

    const legacy = ProviderConfigSchema.safeParse(parsed);
    if (legacy.success) {
      return legacy.data;
    }

    throw new ConfigError(
      `Invalid config file format at ${configPath}: ${current.error.errors
        .map((error) => error.message)
        .join(", ")}`,
      "INVALID_CONFIG",
    );
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new ConfigError(
        `Config file contains invalid JSON at ${configPath}`,
        "INVALID_JSON",
      );
    }
    throw error;
  }
}

function getApiKeyFromEnv(): string | null {
  return process.env.RETELL_API_KEY || null;
}

export function getConfig(options: ConfigPathOptions = {}): Config {
  const envApiKey = getApiKeyFromEnv();
  if (envApiKey) {
    return { apiKey: envApiKey, defaultFormat: "json" };
  }

  for (const configPath of getConfigSearchPaths(options)) {
    const config = readConfigFile(configPath);
    if (config) {
      return config;
    }
  }

  throw new ConfigError(
    `No configuration found. Run \`vac retell login\` or set RETELL_API_KEY. Checked: ${getConfigSearchPaths(options).join(", ")}`,
    "NO_CONFIG",
  );
}

export function saveConfig(
  config: Partial<Config>,
  options: ConfigPathOptions = { scope: "global" },
): string {
  let providerConfig: Config;
  try {
    providerConfig = ProviderConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigError(
        `Invalid configuration: ${error.errors.map((issue) => issue.message).join(", ")}`,
        "INVALID_CONFIG",
      );
    }
    throw error;
  }

  const configPath = getConfigPathForScope(options);
  try {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify({ providers: { retell: providerConfig } }, null, 2),
      { encoding: "utf-8", mode: CONFIG_FILE_PERMISSIONS },
    );
    chmodSync(configPath, CONFIG_FILE_PERMISSIONS);
    return configPath;
  } catch (error) {
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

export function isUsingEnvVar(): boolean {
  return getApiKeyFromEnv() !== null;
}
