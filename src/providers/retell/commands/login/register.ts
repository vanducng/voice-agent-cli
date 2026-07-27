import type { Command } from "commander";
import { loginCommand } from "../login";

export function registerLoginCommands(program: Command): void {
  program
    .command("login")
    .description("Authenticate with Retell AI")
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
  $ vac retell login
  # Enter your API key when prompted
  # Creates $XDG_CONFIG_HOME/voice-agent/config.json
  # Falls back to ~/.config/voice-agent/config.json

  $ vac retell login --local
  # Creates ./.voice-agent.json for this directory
  `,
    )
    .action(async (options) => {
      await loginCommand({
        global: options.global,
        local: options.local,
      });
    });
}
