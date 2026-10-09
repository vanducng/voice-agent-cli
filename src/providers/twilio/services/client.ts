import Twilio from "twilio";
import { getTwilioCredentials, type TwilioCredentials } from "./config";

export interface TwilioHttpClient {
  request(opts: {
    method: string;
    uri: string;
    username?: string;
    password?: string;
    headers?: Record<string, unknown>;
    params?: object;
    data?: object;
    timeout?: number;
    allowRedirects?: boolean;
    logLevel?: string;
  }): Promise<{ statusCode: number; body: unknown; headers?: unknown }>;
}

export interface TwilioClientOptions {
  httpClient?: TwilioHttpClient;
}

export function createTwilioClient(
  credentials: TwilioCredentials,
  options: TwilioClientOptions = {},
): Twilio.Twilio {
  const sdkOptions: Twilio.ClientOpts = {
    autoRetry: false,
    timeout: 30000,
    env: {},
  };
  if (options.httpClient) {
    // The SDK types this as its RequestClient class but only calls request().
    sdkOptions.httpClient =
      options.httpClient as Twilio.ClientOpts["httpClient"];
  }

  if (credentials.apiKey && credentials.apiSecret) {
    return Twilio(credentials.apiKey, credentials.apiSecret, {
      ...sdkOptions,
      accountSid: credentials.accountSid,
    });
  }
  if (!credentials.authToken) {
    throw new Error("Twilio auth token is missing.");
  }

  return Twilio(credentials.accountSid, credentials.authToken, sdkOptions);
}

export function getTwilioClient(): Twilio.Twilio {
  return createTwilioClient(getTwilioCredentials());
}
