import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const agentGuide = readFileSync(
  new URL("../AGENTS.md", import.meta.url),
  "utf8",
);
const claudeGuide = readFileSync(
  new URL("../CLAUDE.md", import.meta.url),
  "utf8",
);
const agentSkill = readFileSync(
  new URL("../skills/voice-agent/SKILL.md", import.meta.url),
  "utf8",
);
const publishWorkflow = readFileSync(
  new URL("../.github/workflows/publish.yml", import.meta.url),
  "utf8",
);

describe("package metadata", () => {
  it("publishes the voice-agent-cli identity", () => {
    expect(packageJson).toMatchObject({
      name: "voice-agent-cli",
      author: "Duc Nguyen <me@vanducng.dev>",
      license: "MIT",
      repository: {
        type: "git",
        url: "git+https://github.com/vanducng/voice-agent-cli.git",
      },
      bugs: {
        url: "https://github.com/vanducng/voice-agent-cli/issues",
      },
      homepage: "https://vanducng.github.io/voice-agent-cli/",
      publishConfig: { access: "public" },
    });
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  });

  it("uses provider-neutral discovery metadata", () => {
    expect(packageJson.description).toBe(
      "Provider-neutral CLI for managing voice agents, calls, prompts, and related resources",
    );
    expect(packageJson.keywords).toEqual([
      "voice-agent",
      "voice-ai",
      "cli",
      "ai-agents",
      "conversational-ai",
      "prompt-management",
      "call-management",
    ]);
  });

  it("targets the vac CLI runtime with a readable alias", () => {
    expect(packageJson.bin).toEqual({
      vac: ["dist", "index.js"].join("/"),
      "voice-agent": ["dist", "index.js"].join("/"),
    });
    expect(packageJson.engines.node).toBe(">=22");
    expect(packageJson.scripts.build).toContain("--target=node22");
  });

  it("pins the Retell SDK and does not ship dotenv", () => {
    expect(packageJson.dependencies["retell-sdk"]).toBe("5.48.0");
    expect(packageJson.dependencies).not.toHaveProperty("dotenv");
  });

  it("publishes only runtime and user-facing package files", () => {
    expect(packageJson.files).toEqual([
      "dist",
      "skills",
      "AGENTS.md",
      "CLAUDE.md",
      "README.md",
      "LICENSE",
    ]);
    expect(packageJson.files).not.toContain("CHANGELOG.md");
  });

  it("ships agent guidance with a Claude entrypoint", () => {
    expect(agentGuide).toContain("skills/voice-agent/SKILL.md");
    expect(claudeGuide.trim()).toBe("@AGENTS.md");
    expect(agentSkill).toMatch(/^---\nname: voice-agent\n/);
  });

  it("auto-merges generated releases only after CI", () => {
    expect(publishWorkflow).toContain(
      "actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1",
    );
    expect(publishWorkflow).toContain(
      "token: ${{ steps.app_token.outputs.token }}",
    );
    expect(publishWorkflow).toContain('gh pr checks "${PR_NUMBER}"');
    expect(publishWorkflow).toContain("REQUIRED_CHECKS=0");
    expect(publishWorkflow).toContain('.state != "SUCCESS"');
    expect(publishWorkflow).toContain('--match-head-commit "${HEAD_SHA}"');
  });
});
