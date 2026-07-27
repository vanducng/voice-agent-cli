import { afterEach, describe, expect, it, vi } from "vitest";
import { npmUpgradeCommand, resolveNpmCli, upgradeCli } from "./upgrade";

afterEach(() => {
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe("upgrade command", () => {
  it("installs the latest package with npm and returns verification guidance", () => {
    const execute = vi.fn();
    const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const npmCliPath = "/trusted/npm/bin/npm-cli.js";

    upgradeCli("0.2.0", execute, () => npmCliPath);

    expect(execute).toHaveBeenCalledWith(process.execPath, [
      npmCliPath,
      "install",
      "--global",
      "voice-agent-cli@latest",
    ]);
    expect(JSON.parse(String(output.mock.calls[0][0]))).toEqual({
      ok: true,
      action: "upgrade",
      package: "voice-agent-cli",
      previous_version: "0.2.0",
      requested_version: "latest",
      next_steps: ["Run `vac --version` to verify the installed version."],
    });
    expect(process.exitCode).toBeUndefined();
  });

  it("executes the resolved npm CLI through an absolute Node executable", () => {
    expect(
      npmUpgradeCommand(
        "C:\\Program Files\\nodejs\\node.exe",
        "C:\\trusted\\npm\\bin\\npm-cli.js",
      ),
    ).toEqual({
      executable: "C:\\Program Files\\nodejs\\node.exe",
      args: [
        "C:\\trusted\\npm\\bin\\npm-cli.js",
        "install",
        "--global",
        "voice-agent-cli@latest",
      ],
    });
  });

  it("resolves npm from the active Node.js installation", () => {
    expect(resolveNpmCli()).toMatch(/npm-cli\.js$/);
  });

  it("derives the safe npm path on Windows", () => {
    const expected =
      "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js";

    expect(
      resolveNpmCli(
        "C:\\Program Files\\nodejs\\node.exe",
        "win32",
        (path) => path === expected,
      ),
    ).toBe(expected);
  });

  it("resolves split Node and npm installations outside the working tree", () => {
    const files = new Set(["/workspace/bin/npm", "/usr/bin/npm"]);

    expect(
      resolveNpmCli(
        "/usr/bin/node",
        "linux",
        (path) => files.has(path),
        "/workspace/bin:/usr/bin",
        "/workspace",
        (path) =>
          path === "/usr/bin/npm"
            ? "/usr/share/nodejs/npm/bin/npm-cli.js"
            : "/workspace/bin/npm-cli.js",
      ),
    ).toBe("/usr/share/nodejs/npm/bin/npm-cli.js");
  });

  it("returns a structured error when npm cannot upgrade the package", () => {
    const execute = vi.fn(() => {
      throw new Error("npm failed");
    });
    const output = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    upgradeCli("0.2.0", execute, () => "/trusted/npm/bin/npm-cli.js");

    expect(JSON.parse(String(output.mock.calls[0][0]))).toEqual({
      ok: false,
      error: {
        code: "UPGRADE_FAILED",
        message: "Unable to upgrade Voice Agent CLI with npm.",
        retryable: true,
        next_steps: [
          "Run `npm install --global voice-agent-cli@latest` directly to inspect npm's error.",
          "Verify that Node.js 22 or newer is active and npm's global install directory is writable.",
        ],
      },
    });
    expect(process.exitCode).toBe(1);
  });
});
