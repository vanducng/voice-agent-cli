import { afterEach, describe, expect, it } from "vitest";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  maskDynamicVariables,
  mergeTagDynamicVariables,
  resolveDynamicVariableUpdate,
} from "./tag-variables";

describe("tag dynamic variables", () => {
  const tmpPath = join(
    tmpdir(),
    `voice-agent-cli-tag-variables-${process.pid}.json`,
  );

  afterEach(() => {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  });

  it("returns undefined when no variable input is present", () => {
    expect(resolveDynamicVariableUpdate({})).toBeUndefined();
  });

  it("parses JSON, then lets repeated --set values override those keys", () => {
    expect(
      resolveDynamicVariableUpdate({
        dynamicVariables: JSON.stringify({
          service__base_url: "https://old.example.com",
          region: "us",
        }),
        set: ["region=ca", "service__base_url=https://staging.example.com"],
      }),
    ).toEqual({
      replace: false,
      patch: {
        service__base_url: "https://staging.example.com",
        region: "ca",
      },
    });
  });

  it("parses a variables file and marks --replace", () => {
    writeFileSync(
      tmpPath,
      JSON.stringify({ service__base_url: "https://prod.example.com" }),
    );

    expect(
      resolveDynamicVariableUpdate({
        dynamicVariablesFile: tmpPath,
        replace: true,
      }),
    ).toEqual({
      replace: true,
      patch: { service__base_url: "https://prod.example.com" },
    });
  });

  it("rejects both JSON inputs, non-strings, and a bare --replace", () => {
    expect(() =>
      resolveDynamicVariableUpdate({
        dynamicVariables: "{}",
        dynamicVariablesFile: tmpPath,
      }),
    ).toThrow(/only one of --dynamic-variables/i);
    expect(() =>
      resolveDynamicVariableUpdate({ dynamicVariables: '{"attempt":2}' }),
    ).toThrow("--dynamic-variables.attempt must be a string");
    expect(() => resolveDynamicVariableUpdate({ replace: true })).toThrow(
      "--replace requires",
    );
    expect(() => resolveDynamicVariableUpdate({ set: ["novalue"] })).toThrow(
      "--set must be KEY=VALUE",
    );
  });

  it("merges by default and replaces only when asked", () => {
    const current = {
      region: "us",
      service__api_key: "live-secret",
    };

    expect(
      mergeTagDynamicVariables(current, {
        replace: false,
        patch: { service__base_url: "https://staging.example.com" },
      }),
    ).toEqual({
      region: "us",
      service__api_key: "live-secret",
      service__base_url: "https://staging.example.com",
    });
    expect(
      mergeTagDynamicVariables(current, {
        replace: true,
        patch: { region: "ca" },
      }),
    ).toEqual({ region: "ca" });
    expect(current).toEqual({
      region: "us",
      service__api_key: "live-secret",
    });
  });

  it("masks secret-looking keys and leaves other values visible", () => {
    expect(
      maskDynamicVariables({
        service__base_url: "https://staging.example.com",
        service__api_key: "live-secret",
        access_token: "tok",
        client_secret: "sec",
        db_password: "pw",
      }),
    ).toEqual({
      service__base_url: "https://staging.example.com",
      service__api_key: "***",
      access_token: "***",
      client_secret: "***",
      db_password: "***",
    });
  });
});
