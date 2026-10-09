import { describe, expect, it } from "vitest";
import { createTwilioClient } from "./client";
import {
  ACCOUNT,
  API_KEY,
  API_SECRET,
  TOKEN,
  createTwilioHttp,
} from "../testing/http";

describe("twilio client", () => {
  it("sends the account SID for token auth and the API key for key auth", async () => {
    const tokenHttp = createTwilioHttp();
    const tokenClient = createTwilioClient(
      { accountSid: ACCOUNT, authToken: TOKEN, defaultFormat: "json" },
      { httpClient: tokenHttp.httpClient },
    );
    await tokenClient.api.v2010.accounts(ACCOUNT).fetch();
    expect(tokenHttp.requests[0]).toMatchObject({
      username: ACCOUNT,
      password: TOKEN,
    });

    const keyHttp = createTwilioHttp();
    const keyClient = createTwilioClient(
      {
        accountSid: ACCOUNT,
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        defaultFormat: "json",
      },
      { httpClient: keyHttp.httpClient },
    );
    await keyClient.api.v2010.accounts(ACCOUNT).fetch();
    expect(keyHttp.requests[0]).toMatchObject({
      username: API_KEY,
      password: API_SECRET,
    });
    expect(keyHttp.requests[0]?.uri).toContain(ACCOUNT);
  });
});
