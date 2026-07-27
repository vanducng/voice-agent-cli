import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { promptSecret } from "./secret-prompt";

describe("promptSecret", () => {
  it("does not echo plaintext input and restores terminal mode", async () => {
    const input = new PassThrough() as PassThrough & NodeJS.ReadStream;
    const output = new PassThrough() as PassThrough & NodeJS.WriteStream;
    const rawModes: boolean[] = [];
    let rendered = "";

    input.isTTY = true;
    input.isRaw = false;
    input.setRawMode = vi.fn((enabled: boolean) => {
      rawModes.push(enabled);
      input.isRaw = enabled;
      return input;
    });
    output.isTTY = true;
    output.on("data", (chunk) => {
      rendered += chunk.toString();
    });

    const answer = promptSecret(input, output, "API key: ");
    input.end("plain-secret\n");

    await expect(answer).resolves.toBe("plain-secret");
    expect(rendered).toBe("API key: \n");
    expect(rendered).not.toContain("plain-secret");
    expect(rawModes).toEqual([true, false]);
  });
});
