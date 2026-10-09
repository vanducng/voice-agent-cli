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
  getTwilioCredentials,
  saveTwilioConfig,
  twilioEnvPresent,
} from "./config";

const ACCOUNT = `AC${"1".repeat(32)}`;
const OTHER_ACCOUNT = `AC${"2".repeat(32)}`;
const TOKEN = "auth-token-value-not-real";
const API_KEY = `SK${"b".repeat(32)}`;
const API_SECRET = "api-secret-value-not-real";

describe("twilio config", () => {
  let rootDir: string;
  let cwd: string;
  let homeDir: string;
  let xdgConfigHome: string;
  const paths = () => ({ cwd, homeDir, xdgConfigHome });

  beforeEach(() => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_API_KEY", "");
    vi.stubEnv("TWILIO_API_SECRET", "");
    vi.stubEnv("XDG_CONFIG_HOME", "");
    rootDir = mkdtempSync(join(tmpdir(), "voice-agent-twilio-config-"));
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

  function writeProvider(
    path: string,
    twilio: unknown,
    retell?: unknown,
  ): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      path,
      JSON.stringify({
        providers: {
          ...(retell ? { retell } : {}),
          ...(twilio ? { twilio } : {}),
        },
      }),
    );
    chmodSync(path, 0o600);
  }

  it("prefers a complete environment and does not mix it with a file", () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", ACCOUNT);
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    writeProvider(join(cwd, ".voice-agent.json"), {
      accountSid: OTHER_ACCOUNT,
      authToken: "file-token-value-not-real",
    });

    expect(getTwilioCredentials(paths())).toEqual({
      accountSid: ACCOUNT,
      authToken: TOKEN,
      defaultFormat: "json",
    });
    expect(twilioEnvPresent()).toBe(true);
  });

  it("accepts an API key triple and rejects a mix or a partial environment", () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", ACCOUNT);
    vi.stubEnv("TWILIO_API_KEY", API_KEY);
    vi.stubEnv("TWILIO_API_SECRET", API_SECRET);
    expect(getTwilioCredentials(paths())).toEqual({
      accountSid: ACCOUNT,
      apiKey: API_KEY,
      apiSecret: API_SECRET,
      defaultFormat: "json",
    });

    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    expect(() => getTwilioCredentials(paths())).toThrow(/not both/);

    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_API_KEY", "");
    vi.stubEnv("TWILIO_API_SECRET", "");
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    writeProvider(join(cwd, ".voice-agent.json"), {
      accountSid: ACCOUNT,
      authToken: TOKEN,
    });
    expect(() => getTwilioCredentials(paths())).toThrow(
      /TWILIO_ACCOUNT_SID is required/,
    );
  });

  it("lets the local file override the XDG file and skips a Retell-only file", () => {
    writeProvider(join(xdgConfigHome, "voice-agent", "config.json"), {
      accountSid: ACCOUNT,
      authToken: TOKEN,
    });
    writeProvider(join(cwd, ".voice-agent.json"), undefined, {
      apiKey: "retell-key",
      defaultFormat: "json",
    });

    expect(getTwilioCredentials(paths()).accountSid).toBe(ACCOUNT);

    writeProvider(join(cwd, ".voice-agent.json"), {
      accountSid: OTHER_ACCOUNT,
      authToken: TOKEN,
    });
    expect(getTwilioCredentials(paths()).accountSid).toBe(OTHER_ACCOUNT);
  });

  it("saves Twilio credentials beside Retell with owner-only permissions", () => {
    const path = join(homeDir, ".config", "voice-agent", "config.json");
    writeProvider(path, undefined, {
      apiKey: "retell-key",
      defaultFormat: "json",
    });

    const saved = saveTwilioConfig(
      { accountSid: ACCOUNT, authToken: TOKEN, defaultFormat: "json" },
      { scope: "global", homeDir },
    );

    expect(saved).toBe(path);
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({
      providers: {
        retell: { apiKey: "retell-key", defaultFormat: "json" },
        twilio: {
          accountSid: ACCOUNT,
          authToken: TOKEN,
          defaultFormat: "json",
        },
      },
    });
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });

  it("does not echo secrets from invalid JSON or an invalid SID", () => {
    const path = join(cwd, ".voice-agent.json");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `{${TOKEN}`);

    expect(() => getTwilioCredentials(paths())).toThrow(/invalid JSON/);
    try {
      getTwilioCredentials(paths());
    } catch (error) {
      expect(String(error)).not.toContain(TOKEN);
    }

    writeProvider(path, { accountSid: TOKEN, authToken: TOKEN });
    try {
      getTwilioCredentials(paths());
      expect.fail("expected invalid SID");
    } catch (error) {
      expect(String(error)).not.toContain(TOKEN);
      expect((error as { code?: string }).code).toBe("INVALID_CONFIG");
    }
  });

  it("reports the checked paths when no Twilio config exists", () => {
    expect(() => getTwilioCredentials(paths())).toThrow(
      /No Twilio configuration found/,
    );
    expect(() => getTwilioCredentials(paths())).toThrow(
      join(cwd, ".voice-agent.json"),
    );
  });
});
