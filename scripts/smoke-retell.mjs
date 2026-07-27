import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const envFile = resolve(root, ".env");

if (!process.env.RETELL_API_KEY && existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

if (!process.env.RETELL_API_KEY) {
  console.error("Retell read-only smoke: FAIL (RETELL_API_KEY is not set)");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    resolve(root, "dist/index.js"),
    "retell",
    "agents",
    "list",
    "--limit",
    "1",
    "--fields",
    "agent_id",
  ],
  { cwd: root, encoding: "utf8", env: process.env },
);

if (result.error || result.status !== 0) {
  throw new Error(
    `Retell CLI exited with status ${result.status ?? "unknown"}`,
  );
}

const response = JSON.parse(result.stdout);
const items = response?.items;

if (!Array.isArray(items)) {
  throw new Error(
    "Retell POST /v2/list-agents response did not contain the current items array",
  );
}

console.log("Retell read-only smoke: PASS (authenticated agent summary shape)");
