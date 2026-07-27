import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const textExtensions = new Set([".json", ".md", ".ts", ".yml", ".yaml"]);
const ignoredDirectories = new Set([".astro", "dist", "node_modules"]);

function textFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : textFiles(entryPath);
    }
    return textExtensions.has(extname(entry.name)) ? [entryPath] : [];
  });
}

describe("public identity", () => {
  it("uses voice-agent-cli and vac outside generated history", () => {
    const files = [
      join(root, "package.json"),
      join(root, "README.md"),
      ...textFiles(join(root, "docs")),
      ...textFiles(join(root, "src")),
      ...textFiles(join(root, ".github", "workflows")),
    ];
    const oldProject = ["retell", "cli"].join("-");
    const stalePatterns: Array<[string, RegExp]> = [
      ["old scoped package", /@vanducng\/voice-agent\b/],
      ["old command", /\bvoice-agent retell\b/],
      ["old project", new RegExp(`\\b${oldProject}\\b`)],
      ["upstream repository", new RegExp(`github\\.com/awccom/${oldProject}`)],
      ["old repository", /vanducng\/voice-agent(?!-cli)/],
    ];
    const stale = files.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return stalePatterns.flatMap(([label, pattern]) =>
        pattern.test(content) ? [`${file}: ${label}`] : [],
      );
    });

    expect(stale).toEqual([]);
  });

  it("preserves config paths and both executable names", () => {
    const packageJson = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    );
    const config = readFileSync(
      join(root, "src", "providers", "retell", "services", "config.ts"),
      "utf8",
    );

    expect(packageJson.name).toBe("voice-agent-cli");
    expect(packageJson.bin).toEqual({
      "voice-agent": "dist/index.js",
      vac: "dist/index.js",
    });
    expect(config).toContain(".voice-agent.json");
    expect(config).toContain('"voice-agent", "config.json"');
  });
});
