import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { posix, win32 } from "node:path";
import { Command } from "commander";
import { reportCliError } from "../core/cli-response";

const packageName = "voice-agent-cli";
const installArgs = ["install", "--global", `${packageName}@latest`] as const;

type NpmExecutor = (executable: string, args: readonly string[]) => void;
type NpmResolver = () => string;
type FileExists = (path: string) => boolean;
type Realpath = (path: string) => string;

const executeNpm: NpmExecutor = (executable, args) => {
  execFileSync(executable, [...args], { stdio: "ignore" });
};

export function npmUpgradeCommand(
  nodeExecutable: string,
  npmCliPath: string,
): { executable: string; args: readonly string[] } {
  return {
    executable: nodeExecutable,
    args: [npmCliPath, ...installArgs],
  };
}

export function resolveNpmCli(
  nodeExecutable: string = process.execPath,
  platform: NodeJS.Platform = process.platform,
  fileExists: FileExists = existsSync,
  pathValue: string = process.env.PATH ?? "",
  currentDirectory: string = process.cwd(),
  realpath: Realpath = realpathSync,
): string {
  const path = platform === "win32" ? win32 : posix;
  const binDirectory = path.dirname(nodeExecutable);
  const candidates =
    platform === "win32"
      ? [path.join(binDirectory, "node_modules", "npm", "bin", "npm-cli.js")]
      : [
          path.resolve(
            binDirectory,
            "..",
            "lib",
            "node_modules",
            "npm",
            "bin",
            "npm-cli.js",
          ),
          path.join(binDirectory, "node_modules", "npm", "bin", "npm-cli.js"),
        ];
  const resolved = candidates.find(fileExists);

  if (resolved) return resolved;

  if (platform !== "win32") {
    const cwd = path.resolve(currentDirectory);
    const insideCwd = (candidate: string) =>
      candidate === cwd || candidate.startsWith(`${cwd}${path.sep}`);

    for (const entry of pathValue.split(":")) {
      if (!entry || !path.isAbsolute(entry)) continue;
      const directory = path.resolve(entry);
      if (insideCwd(directory)) continue;

      const shim = path.join(directory, "npm");
      if (!fileExists(shim)) continue;

      try {
        const target = realpath(shim);
        if (
          path.isAbsolute(target) &&
          !insideCwd(target) &&
          path.basename(target) === "npm-cli.js"
        ) {
          return target;
        }
      } catch {
        continue;
      }
    }
  }

  throw new Error("npm CLI was not found for the active Node.js runtime.");
}

export function upgradeCli(
  currentVersion: string,
  execute: NpmExecutor = executeNpm,
  resolveNpm: NpmResolver = resolveNpmCli,
): void {
  try {
    const command = npmUpgradeCommand(process.execPath, resolveNpm());
    execute(command.executable, command.args);
  } catch {
    reportCliError({
      code: "UPGRADE_FAILED",
      message: "Unable to upgrade Voice Agent CLI with npm.",
      retryable: true,
      nextSteps: [
        "Run `npm install --global voice-agent-cli@latest` directly to inspect npm's error.",
        "Verify that Node.js 22 or newer is active and npm's global install directory is writable.",
      ],
    });
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "upgrade",
        package: packageName,
        previous_version: currentVersion,
        requested_version: "latest",
        next_steps: ["Run `vac --version` to verify the installed version."],
      },
      null,
      2,
    ),
  );
}

export function registerUpgradeCommand(
  program: Command,
  currentVersion: string,
): void {
  program
    .command("upgrade")
    .description("Upgrade Voice Agent CLI to the latest npm release")
    .action(() => upgradeCli(currentVersion));
}
