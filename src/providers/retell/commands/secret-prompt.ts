import * as readline from "node:readline/promises";
import { Writable } from "node:stream";

export async function promptSecret(
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
  prompt: string,
): Promise<string> {
  const mutedOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const rl = readline.createInterface({
    input,
    output: mutedOutput,
    terminal: true,
  });
  output.write(prompt);

  try {
    return await rl.question("");
  } finally {
    rl.close();
    output.write("\n");
  }
}
