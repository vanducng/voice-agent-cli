import { readFileSync, readdirSync } from "fs";
import { join, sep } from "path";
import { describe, expect, it } from "vitest";

const sdkBoundaries = [
  ["retell-sdk", "providers/retell/"],
  ["twilio", "providers/twilio/"],
] as const;

describe("provider boundaries", () => {
  it.each(sdkBoundaries)("keeps %s imports inside %s", (sdk, providerRoot) => {
    const violations = readdirSync(__dirname, {
      recursive: true,
      encoding: "utf8",
    })
      .filter((file) => file.endsWith(".ts"))
      .filter((file) => {
        const source = readFileSync(join(__dirname, file), "utf8");
        return new RegExp(
          `\\b(?:from\\s+|(?:import|require)\\s*\\(|(?:vi|jest)\\.mock\\()\\s*["']${sdk}(?:\\/[^"']*)?["']`,
        ).test(source);
      })
      .filter((file) => !file.split(sep).join("/").startsWith(providerRoot));

    expect(violations).toEqual([]);
  });
});
