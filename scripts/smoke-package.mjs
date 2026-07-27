import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const temp = mkdtempSync(join(tmpdir(), "voice-agent-package-"));
const childEnv = Object.fromEntries(
  [
    "PATH",
    "HOME",
    "USERPROFILE",
    "SYSTEMROOT",
    "SystemRoot",
    "COMSPEC",
    "ComSpec",
    "PATHEXT",
    "TMPDIR",
    "TMP",
    "TEMP",
    "LANG",
    "LC_ALL",
    "CI",
  ].flatMap((key) =>
    process.env[key] === undefined ? [] : [[key, process.env[key]]],
  ),
);

function execute(command, args, cwd = root) {
  return spawnSync(command, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function run(command, args, cwd = root) {
  const result = execute(command, args, cwd);

  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} failed with exit ${result.status ?? "unknown"}: ${result.stderr.trim()}`,
    );
  }

  return result.stdout;
}

function executable(prefix, name) {
  return process.platform === "win32"
    ? join(prefix, `${name}.cmd`)
    : join(prefix, "bin", name);
}

try {
  const packed = JSON.parse(
    run("npm", [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      temp,
    ]),
  );
  const tarball = join(temp, packed[0].filename);
  const prefix = join(temp, "install");

  run(
    "npm",
    ["install", "--ignore-scripts", "--global", "--prefix", prefix, tarball],
    temp,
  );

  const packageRoot = join(
    run("npm", ["root", "--global", "--prefix", prefix], temp).trim(),
    "voice-agent-cli",
  );
  for (const path of [
    "AGENTS.md",
    "CLAUDE.md",
    join("skills", "voice-agent-cli", "SKILL.md"),
    join("skills", "voice-agent-cli", "agents", "openai.yaml"),
  ]) {
    if (!existsSync(join(packageRoot, path))) {
      throw new Error(`installed package is missing ${path}`);
    }
  }

  const vacRootHelp = run(executable(prefix, "vac"), ["--help"], temp);
  const aliasRootHelp = run(
    executable(prefix, "voice-agent"),
    ["--help"],
    temp,
  );
  const vacRetellHelp = run(
    executable(prefix, "vac"),
    ["retell", "--help"],
    temp,
  );
  const aliasRetellHelp = run(
    executable(prefix, "voice-agent"),
    ["retell", "--help"],
    temp,
  );

  if (
    !vacRootHelp.includes("vac") ||
    !vacRootHelp.includes("upgrade") ||
    !vacRootHelp.includes("retell")
  ) {
    throw new Error(
      "installed root help is missing the CLI, upgrade, or provider command",
    );
  }
  if (vacRootHelp !== aliasRootHelp || vacRetellHelp !== aliasRetellHelp) {
    throw new Error("installed vac and voice-agent binaries differ");
  }
  if (!vacRetellHelp.includes("Manage Retell AI resources")) {
    throw new Error(
      "installed Retell help is missing the provider description",
    );
  }

  const invalidVac = execute(
    executable(prefix, "vac"),
    ["not-a-command"],
    temp,
  );
  const invalidAlias = execute(
    executable(prefix, "voice-agent"),
    ["not-a-command"],
    temp,
  );
  if (
    invalidVac.status === 0 ||
    invalidAlias.status === 0 ||
    invalidVac.stdout !== "" ||
    invalidAlias.stdout !== "" ||
    invalidVac.stderr !== invalidAlias.stderr
  ) {
    throw new Error("installed binaries do not share the failure contract");
  }

  const failure = JSON.parse(invalidVac.stderr);
  if (
    failure.ok !== false ||
    typeof failure.error?.code !== "string" ||
    typeof failure.error?.message !== "string" ||
    typeof failure.error?.retryable !== "boolean" ||
    !Array.isArray(failure.error?.next_steps) ||
    failure.error.next_steps.length === 0
  ) {
    throw new Error(
      "installed invalid-command response is not actionable JSON",
    );
  }

  console.log(
    "Package smoke: PASS (packed, installed, agent guidance, both binaries, help, structured errors)",
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
