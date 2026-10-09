import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listCallsCommand } from "./list";
import {
  ACCOUNT,
  PHONE,
  TOKEN,
  TRUNK_CALL_SID,
  TRUNK_CALL_SID_2,
  TRUNK_SIP_FROM,
  TRUNK_SIP_TO,
  http,
  installHttp,
} from "../../testing/http";

vi.mock("../../services/client", async () => {
  const actual = await vi.importActual<typeof import("../../services/client")>(
    "../../services/client",
  );
  const fixture = await import("../../testing/http");
  return {
    ...actual,
    getTwilioClient: () =>
      actual.createTwilioClient(
        {
          accountSid: fixture.ACCOUNT,
          authToken: fixture.TOKEN,
          defaultFormat: "json",
        },
        { httpClient: fixture.http().httpClient },
      ),
  };
});

function jsonFrom(spy: ReturnType<typeof vi.spyOn>): {
  items: Array<{ sid: string; to?: string; from?: string; direction?: string }>;
  has_more: boolean;
  pagination_key?: string;
} {
  return JSON.parse(String(spy.mock.calls.at(-1)?.[0]));
}

describe("twilio call endpoint filters", () => {
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    installHttp();
    vi.stubEnv("TWILIO_ACCOUNT_SID", ACCOUNT);
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_API_KEY", "");
    vi.stubEnv("TWILIO_API_SECRET", "");
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("matches a trunking-originating SIP To and resumes at the next match", async () => {
    await listCallsCommand({
      to: PHONE,
      limit: "1",
      fields: "sid,to,direction",
    });

    expect(
      http().requests.every(
        (request) =>
          request.params?.To === undefined &&
          request.params?.From === undefined,
      ),
    ).toBe(true);
    expect(
      http().requests.some((request) =>
        String(request.params?.PageToken ?? "").startsWith("offset:"),
      ),
    ).toBe(true);
    const first = jsonFrom(log);
    expect(first).toMatchObject({
      items: [
        {
          sid: TRUNK_CALL_SID,
          to: TRUNK_SIP_TO,
          direction: "trunking-originating",
        },
      ],
      has_more: true,
    });

    installHttp();
    await listCallsCommand({
      to: PHONE,
      limit: "1",
      paginationKey: first.pagination_key,
      fields: "sid,to",
    });
    expect(jsonFrom(log)).toEqual({
      items: [{ sid: TRUNK_CALL_SID_2, to: TRUNK_SIP_TO }],
      has_more: false,
    });
  });

  it("matches an E.164 number inside a SIP From", async () => {
    await listCallsCommand({
      from: "+15555550102",
      limit: "10",
      fields: "sid,from",
    });

    expect(jsonFrom(log)).toEqual({
      items: [{ sid: TRUNK_CALL_SID, from: TRUNK_SIP_FROM }],
      has_more: false,
    });
    expect(http().requests[0]?.params).not.toHaveProperty("From");
  });
});
