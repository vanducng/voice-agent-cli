import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createTwilioClient } from "../services/client";
import {
  configFileExists,
  getConfigFilePath,
  saveTwilioConfig,
  twilioEnvPresent,
  validateTwilioCredentials,
  type ConfigScope,
  type TwilioCredentials,
} from "../services/config";
import { CliFailure, handleTwilioError, outputJson } from "../services/errors";
import { promptSecret } from "./secret-prompt";

export interface LoginOptions {
  global?: boolean;
  local?: boolean;
}

function resolveScope(options: LoginOptions): ConfigScope {
  if (options.global && options.local) {
    throw new CliFailure(
      "INVALID_INPUT",
      "Use only one of --global or --local.",
      false,
      ["Run `vac twilio login --help` and pass only one scope flag."],
    );
  }
  return options.local ? "local" : "global";
}

async function promptVisible(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
}

async function promptCredentials(): Promise<TwilioCredentials> {
  const accountSid = (
    await promptVisible("Enter your Twilio account SID: ")
  ).trim();
  const authToken = (
    await promptSecret(
      stdin,
      stdout,
      "Auth token (hidden, empty to use an API key): ",
    )
  ).trim();

  if (authToken) {
    return validateTwilioCredentials({
      accountSid,
      authToken,
      defaultFormat: "json",
    });
  }

  const apiKey = (
    await promptSecret(stdin, stdout, "API key SID (hidden): ")
  ).trim();
  const apiSecret = (
    await promptSecret(stdin, stdout, "API secret (hidden): ")
  ).trim();
  return validateTwilioCredentials({
    accountSid,
    apiKey,
    apiSecret,
    defaultFormat: "json",
  });
}

export async function loginCommand(options: LoginOptions = {}): Promise<void> {
  try {
    const scope = resolveScope(options);
    if (!stdin.isTTY || !stdout.isTTY) {
      throw new CliFailure(
        "NON_INTERACTIVE",
        "Interactive login requires a TTY.",
        false,
        [
          "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for this process.",
          "Or set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET.",
          "Run `vac twilio numbers list --limit 1` after the variables are set.",
        ],
      );
    }

    const configPath = getConfigFilePath({ scope });
    if (configFileExists({ scope })) {
      const overwrite = await promptVisible(
        `${scope} config already exists at ${configPath}. Overwrite Twilio credentials? (y/n): `,
      );
      if (overwrite.toLowerCase() !== "y") {
        outputJson({ ok: true, message: "Login cancelled" });
        return;
      }
    }

    const credentials = await promptCredentials();
    const client = createTwilioClient(credentials);
    await client.api.v2010.accounts(credentials.accountSid).fetch();
    const savedPath = saveTwilioConfig(credentials, { scope });
    const envOverride = twilioEnvPresent();
    outputJson({
      ok: true,
      message: "Successfully authenticated.",
      scope,
      auth: credentials.apiKey ? "api_key" : "auth_token",
      configPath: savedPath,
      nextSteps: envOverride
        ? [
            "Unset TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY, and TWILIO_API_SECRET to use this saved login.",
            "Run `vac twilio numbers list --limit 1` after those variables are unset.",
          ]
        : scope === "global"
          ? [
              "Try from any directory: vac twilio numbers list --limit 1",
              "Try from any directory: vac twilio trunks list --limit 1",
            ]
          : [
              "Try from this directory: vac twilio numbers list --limit 1",
              "Use vac twilio login --global for auth from any directory",
            ],
    });
  } catch (error) {
    handleTwilioError(error);
  }
}
