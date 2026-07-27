import { run } from "./cli";
import { reportUnexpectedError } from "./core/cli-response";

if (require.main === module) {
  void run().catch(reportUnexpectedError);
}

export { createProgram, run } from "./cli";
