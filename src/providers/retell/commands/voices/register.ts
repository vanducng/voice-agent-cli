import type { Command } from "commander";
import { listVoicesCommand } from "./list";
import { getVoiceCommand } from "./get";
import { addVoiceResourceCommand } from "./add-resource";
import { cloneVoiceCommand } from "./clone";
import { searchVoicesCommand } from "./search";

export function registerVoicesCommands(program: Command): void {
  const voices = program
    .command("voices")
    .description("Manage and search voice resources");

  voices
    .command("list")
    .description("List all voices available to this account")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await listVoicesCommand(options);
    });

  voices
    .command("get <voice_id>")
    .description("Get a specific voice")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (voiceId, options) => {
      await getVoiceCommand(voiceId, options);
    });

  voices
    .command("add-resource")
    .description("Add a community voice to the account's library")
    .requiredOption(
      "--provider-voice-id <id>",
      "Voice id assigned by the provider",
    )
    .requiredOption("--voice-name <name>", "Custom name for the voice")
    .option(
      "--voice-provider <p>",
      "elevenlabs, cartesia, minimax, or fish_audio",
    )
    .option(
      "--public-user-id <id>",
      "ElevenLabs only: public user id of the owner",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await addVoiceResourceCommand(options);
    });

  voices
    .command("clone")
    .description("Clone a voice from one or more audio files")
    .requiredOption("--voice-name <name>", "Name for the cloned voice")
    .requiredOption(
      "--voice-provider <p>",
      "elevenlabs, cartesia, minimax, fish_audio, or platform",
    )
    .option(
      "--file <path>",
      "Audio file to use for cloning (repeat for multiple files)",
      (value: string, previous: string[] = []) => [...previous, value],
      [] as string[],
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .addHelpText(
      "after",
      `
Examples:
  $ vac retell voices clone --voice-name "Dev Clone" --voice-provider elevenlabs --file sample.wav
  $ vac retell voices clone --voice-name "Multi" --voice-provider elevenlabs --file one.wav --file two.wav
    `,
    )
    .action(async (options) => {
      await cloneVoiceCommand(options);
    });

  voices
    .command("search")
    .description("Search community voices from a provider")
    .requiredOption(
      "--search-query <query>",
      "Search query (name, description, or id)",
    )
    .option(
      "--voice-provider <p>",
      "elevenlabs, cartesia, minimax, or fish_audio",
    )
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .action(async (options) => {
      await searchVoicesCommand(options);
    });
}
