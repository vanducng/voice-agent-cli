import { readFileSync, readdirSync } from "fs";
import { join, sep } from "path";
import { describe, expect, it } from "vitest";

describe("provider boundaries", () => {
  it("keeps Retell SDK imports inside the Retell provider", () => {
    const violations = readdirSync(__dirname, {
      recursive: true,
      encoding: "utf8",
    })
      .filter((file) => file.endsWith(".ts"))
      .filter((file) => {
        const source = readFileSync(join(__dirname, file), "utf8");
        return /\b(?:from\s+|(?:import|require)\s*\(|(?:vi|jest)\.mock\()\s*["']retell-sdk(?:\/[^"']*)?["']/.test(
          source,
        );
      })
      .filter(
        (file) => !file.split(sep).join("/").startsWith("providers/retell/"),
      );

    expect(violations).toEqual([]);
  });
});
