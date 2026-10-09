import type { Command } from "commander";
import { registerAlertCommands } from "./commands/alerts/register";
import { registerCallCommands } from "./commands/calls/register";
import { registerLoginCommands } from "./commands/login/register";
import { registerMessageCommands } from "./commands/messages/register";
import { registerMessagingServiceCommands } from "./commands/messaging-services/register";
import { registerNumberCommands } from "./commands/numbers/register";
import { registerRecordingCommands } from "./commands/recordings/register";
import { registerTrunkCommands } from "./commands/trunks/register";

export function registerTwilioCommands(root: Command): Command {
  const program = root
    .command("twilio")
    .description("Manage Twilio numbers, trunks, calls, messages, and alerts")
    .helpOption("-h, --help", "Display help for command");

  registerLoginCommands(program);
  registerNumberCommands(program);
  registerTrunkCommands(program);
  registerCallCommands(program);
  registerMessageCommands(program);
  registerMessagingServiceCommands(program);
  registerRecordingCommands(program);
  registerAlertCommands(program);
  return program;
}
