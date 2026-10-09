import type { Command } from "commander";
import { registerCallCommands } from "./commands/calls/register";
import { registerLoginCommands } from "./commands/login/register";
import { registerNumberCommands } from "./commands/numbers/register";
import { registerTrunkCommands } from "./commands/trunks/register";

export function registerTwilioCommands(root: Command): Command {
  const program = root
    .command("twilio")
    .description("Manage Twilio numbers, trunks, and calls")
    .helpOption("-h, --help", "Display help for command");

  registerLoginCommands(program);
  registerNumberCommands(program);
  registerTrunkCommands(program);
  registerCallCommands(program);
  return program;
}
