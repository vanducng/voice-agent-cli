import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configFileExists,
  getConfig,
  getConfigFilePath,
  getConfigSearchPaths,
  getHomeConfigFilePath,
  getLocalConfigFilePath,
  getXdgConfigFilePath,
  saveConfig,
} from "./config";

function writeConfig(path: string, apiKey: string, legacy = false): void {
  mkdirSync(dirname(path), { recursive: true });
  const provider = { apiKey, defaultFormat: "json" };
  writeFileSync(
    path,
    JSON.stringify(legacy ? provider : { providers: { retell: provider } }),
  );
  chmodSync(path, 0o600);
}

describe("config service", () => {
  let rootDir: string;
  let cwd: string;
  let homeDir: string;
  let xdgConfigHome: string;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("RETELL_API_KEY", "");
    vi.stubEnv("XDG_CONFIG_HOME", "");

    rootDir = mkdtempSync(join(tmpdir(), "voice-agent-config-test-"));
    cwd = join(rootDir, "project");
    homeDir = join(rootDir, "home");
    xdgConfigHome = join(rootDir, "xdg");
    mkdirSync(cwd, { recursive: true });
    mkdirSync(homeDir, { recursive: true });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("resolves new and legacy paths in precedence order", () => {
    expect(getLocalConfigFilePath({ cwd })).toBe(
      join(cwd, ".voice-agent.json"),
    );
    expect(getHomeConfigFilePath({ homeDir })).toBe(
      join(homeDir, ".config", "voice-agent", "config.json"),
    );
    expect(getXdgConfigFilePath({ xdgConfigHome })).toBe(
      join(xdgConfigHome, "voice-agent", "config.json"),
    );
    expect(getConfigSearchPaths({ cwd, homeDir, xdgConfigHome })).toEqual([
      join(cwd, ".voice-agent.json"),
      join(xdgConfigHome, "voice-agent", "config.json"),
      join(cwd, ".retellrc.json"),
      join(homeDir, ".retellrc.json"),
      join(xdgConfigHome, "retell", "config.json"),
    ]);
  });

  it("falls back to the home config directory when XDG_CONFIG_HOME is empty", () => {
    expect(getXdgConfigFilePath({ homeDir })).toBe(
      join(homeDir, ".config", "voice-agent", "config.json"),
    );
    expect(getXdgConfigFilePath({ homeDir, xdgConfigHome: "" })).toBe(
      join(homeDir, ".config", "voice-agent", "config.json"),
    );
  });

  it("uses RETELL_API_KEY before new and legacy config files", () => {
    vi.stubEnv("RETELL_API_KEY", "env-key");
    writeConfig(getLocalConfigFilePath({ cwd }), "new-key");
    writeConfig(join(cwd, ".retellrc.json"), "legacy-key", true);

    expect(getConfig({ cwd, homeDir, xdgConfigHome })).toEqual({
      apiKey: "env-key",
      defaultFormat: "json",
    });
  });

  it("uses all new config locations before legacy config", () => {
    writeConfig(getXdgConfigFilePath({ xdgConfigHome }), "new-global-key");
    writeConfig(join(cwd, ".retellrc.json"), "legacy-local-key", true);

    expect(getConfig({ cwd, homeDir, xdgConfigHome }).apiKey).toBe(
      "new-global-key",
    );
  });

  it("lets the new local config override the new global config", () => {
    writeConfig(getLocalConfigFilePath({ cwd }), "new-local-key");
    writeConfig(getXdgConfigFilePath({ xdgConfigHome }), "new-global-key");

    expect(getConfig({ cwd, homeDir, xdgConfigHome }).apiKey).toBe(
      "new-local-key",
    );
  });

  it.each([
    [
      "local",
      (cwd: string, _home: string, _xdg: string) => join(cwd, ".retellrc.json"),
    ],
    [
      "home",
      (_cwd: string, home: string, _xdg: string) =>
        join(home, ".retellrc.json"),
    ],
    [
      "XDG",
      (_cwd: string, _home: string, xdg: string) =>
        join(xdg, "retell", "config.json"),
    ],
  ])("reads the legacy %s config as a fallback", (_name, resolvePath) => {
    writeConfig(resolvePath(cwd, homeDir, xdgConfigHome), "legacy-key", true);

    expect(getConfig({ cwd, homeDir, xdgConfigHome }).apiKey).toBe(
      "legacy-key",
    );
  });

  it("accepts the legacy flat schema without rewriting it", () => {
    const path = getLocalConfigFilePath({ cwd });
    writeConfig(path, "flat-key", true);
    const before = readFileSync(path, "utf-8");

    expect(getConfig({ cwd, homeDir, xdgConfigHome }).apiKey).toBe("flat-key");
    expect(readFileSync(path, "utf-8")).toBe(before);
  });

  it("defaults public path helpers to the new global config path", () => {
    const path = join(homeDir, ".config", "voice-agent", "config.json");
    expect(getConfigFilePath({ homeDir })).toBe(path);
    expect(configFileExists({ homeDir })).toBe(false);

    writeConfig(path, "default-global-key");
    expect(configFileExists({ homeDir })).toBe(true);
  });

  it("saves global config with the provider schema and owner-only permissions", () => {
    const legacyPath = join(homeDir, ".retellrc.json");
    writeConfig(legacyPath, "legacy-key", true);
    const legacyBefore = readFileSync(legacyPath, "utf-8");

    const path = saveConfig(
      { apiKey: "saved-global-key", defaultFormat: "json" },
      { scope: "global", homeDir },
    );

    expect(path).toBe(join(homeDir, ".config", "voice-agent", "config.json"));
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({
      providers: {
        retell: { apiKey: "saved-global-key", defaultFormat: "json" },
      },
    });
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(readFileSync(legacyPath, "utf-8")).toBe(legacyBefore);
  });

  it("saves local config using the new file and schema", () => {
    const path = saveConfig(
      { apiKey: "saved-local-key", defaultFormat: "json" },
      { scope: "local", cwd },
    );

    expect(path).toBe(join(cwd, ".voice-agent.json"));
    expect(configFileExists({ scope: "local", cwd })).toBe(true);
    expect(getConfig({ cwd, homeDir, xdgConfigHome }).apiKey).toBe(
      "saved-local-key",
    );
  });

  it("guides missing configuration with vac and every checked path", () => {
    expect(() => getConfig({ cwd, homeDir, xdgConfigHome })).toThrow(
      expect.objectContaining({
        code: "NO_CONFIG",
        message: expect.stringContaining("vac retell login"),
      }),
    );
  });

  it("reports an invalid config path without echoing its contents", () => {
    const path = getLocalConfigFilePath({ cwd });
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '{"apiKey":"config-secret-marker"');

    expect(() => getConfig({ cwd, homeDir, xdgConfigHome })).toThrow(
      expect.objectContaining({
        code: "INVALID_JSON",
        message: expect.not.stringContaining("config-secret-marker"),
      }),
    );
  });
});
