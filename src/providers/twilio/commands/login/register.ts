import type { Command } from "commander";
import { loginCommand } from "../login";

export function registerLoginCommands(program: Command): void {
  program
    .command("login")
    .description("Authenticate with Twilio and save credentials")
    .option(
      "--global",
      "Save credentials to $XDG_CONFIG_HOME/voice-agent/config.json (default; falls back to ~/.config/voice-agent/config.json)",
    )
    .option(
      "--local",
      "Save credentials to ./.voice-agent.json for this directory only",
    )
    .addHelpText(
      "after",
      `
Examples:
  $ vac twilio login
  $ vac twilio login --local

Environment variables override the saved file:
  TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
  TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET
`,
    )
    .action(async (options) => {
      await loginCommand({ global: options.global, local: options.local });
    });
}
