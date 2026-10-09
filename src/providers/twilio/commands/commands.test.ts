import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportedCliError } from "../../../core/cli-response";
import { getCallCommand } from "./calls/get";
import { listCallsCommand } from "./calls/list";
import { getNumberCommand } from "./numbers/get";
import { listNumbersCommand } from "./numbers/list";
import { updateNumberCommand } from "./numbers/update";
import { getTrunkCommand } from "./trunks/get";
import { listTrunksCommand } from "./trunks/list";
import { addOriginationCommand } from "./trunks/origination-add";
import { removeOriginationCommand } from "./trunks/origination-remove";
import {
  ACCOUNT,
  CALL_SID,
  CREATED_ORIGINATION_SID,
  NUMBER_SID,
  NUMBER_SID_2,
  ORIGINATION_SID,
  PHONE,
  PHONE_2,
  TOKEN,
  TRUNK_SID,
  TRUNK_SID_2,
  http,
  installHttp,
} from "../testing/http";

vi.mock("../services/client", async () => {
  const actual =
    await vi.importActual<typeof import("../services/client")>(
      "../services/client",
    );
  const fixture = await import("../testing/http");
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

function jsonFrom(spy: ReturnType<typeof vi.spyOn>): unknown {
  return JSON.parse(String(spy.mock.calls.at(-1)?.[0]));
}

function methods(): string[] {
  return http().requests.map((request) => request.method.toLowerCase());
}

describe("twilio commands", () => {
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    installHttp();
    vi.stubEnv("TWILIO_ACCOUNT_SID", ACCOUNT);
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_API_KEY", "");
    vi.stubEnv("TWILIO_API_SECRET", "");
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.exitCode = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("lists numbers with cursor pagination and field projection", async () => {
    await listNumbersCommand({
      limit: "1",
      fields: "sid,phone_number,trunk_sid",
    });

    expect(jsonFrom(log)).toEqual({
      items: [{ sid: NUMBER_SID, phone_number: PHONE, trunk_sid: TRUNK_SID }],
      has_more: true,
      pagination_key: "PAGE2",
    });
    expect(http().requests[0]?.params).toMatchObject({ PageSize: 1 });
    expect(http().requests[0]?.username).toBe(ACCOUNT);
    expect(http().requests[0]?.password).toBe(TOKEN);

    await listNumbersCommand({ limit: "1", paginationKey: "PAGE2" });
    expect(jsonFrom(log)).toMatchObject({
      items: [{ sid: NUMBER_SID_2, phone_number: PHONE_2, trunk_sid: null }],
      has_more: false,
    });
  });

  it("gets a number by SID or E.164 and empties blank routing fields", async () => {
    await getNumberCommand(NUMBER_SID);
    expect(jsonFrom(log)).toMatchObject({
      sid: NUMBER_SID,
      phone_number: PHONE,
      trunk_sid: TRUNK_SID,
      voice_url: null,
      voice_method: "POST",
      voice_application_sid: null,
      sms_url: "https://example.com/sms",
      status_callback: null,
    });

    await getNumberCommand(PHONE_2, { fields: "sid,trunk_sid" });
    expect(jsonFrom(log)).toEqual({ sid: NUMBER_SID_2, trunk_sid: null });
    expect(http().requests.at(-1)?.params).toMatchObject({
      PhoneNumber: PHONE_2,
      PageSize: 1,
    });
  });

  it("rejects unknown fields and missing numbers before treating them as success", async () => {
    await expect(
      listNumbersCommand({ fields: "secret" }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({
      error: { code: "VALIDATION_ERROR", retryable: false },
    });
    expect(methods()).toEqual([]);

    await expect(
      getNumberCommand(`PN${"c".repeat(32)}`),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("shows a trunk move in dry-run without a write, then read-back after a real update", async () => {
    await updateNumberCommand(PHONE, { trunk: TRUNK_SID_2, dryRun: true });

    expect(jsonFrom(log)).toMatchObject({
      dry_run: true,
      before: { sid: NUMBER_SID, trunk_sid: TRUNK_SID },
      after: { sid: NUMBER_SID, trunk_sid: TRUNK_SID_2 },
    });
    expect(methods()).toEqual(["get"]);

    await updateNumberCommand(NUMBER_SID, { trunk: "none" });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: false,
      before: { trunk_sid: TRUNK_SID },
      after: { trunk_sid: null },
    });
    const post = http().requests.find(
      (request) => request.method.toLowerCase() === "post",
    );
    expect(post?.data).toMatchObject({ TrunkSid: "" });
    expect(methods().filter((method) => method === "post")).toEqual(["post"]);
  });

  it("does not claim a trunk change when the read-back still has the old trunk", async () => {
    http().setIgnoreMutations(true);

    await expect(
      updateNumberCommand(NUMBER_SID, { trunk: TRUNK_SID_2 }),
    ).rejects.toBeInstanceOf(ReportedCliError);

    expect(jsonFrom(error)).toMatchObject({
      error: { code: "RECONCILIATION_FAILED", retryable: false },
    });
  });

  it("redacts credentials from a failed read and keeps write failures non-retryable", async () => {
    http().failOn("get", 401, `auth_token=${TOKEN} for ${ACCOUNT}`);

    await expect(listNumbersCommand()).rejects.toBeInstanceOf(ReportedCliError);

    const body = String(error.mock.calls.at(-1)?.[0]);
    expect(body).not.toContain(TOKEN);
    expect(body).not.toContain(ACCOUNT);
    expect(jsonFrom(error)).toMatchObject({
      error: {
        code: "AUTH_ERROR",
        retryable: false,
        next_steps: expect.any(Array),
      },
    });

    installHttp();
    http().failOn("post", 429, "slow down");
    await expect(
      updateNumberCommand(NUMBER_SID, { trunk: TRUNK_SID_2 }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({
      error: {
        code: "RATE_LIMIT",
        retryable: false,
        next_steps: [
          "Read the resource again and compare it with the requested change.",
          "Retry the write only after that read shows the change is still absent.",
        ],
      },
    });

    installHttp();
    http().failOn("get", 429, "slow down");
    await expect(listNumbersCommand()).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({
      error: { code: "RATE_LIMIT", retryable: true },
    });
  });

  it("lists and gets trunks with origination URLs and attached numbers", async () => {
    await listTrunksCommand({
      limit: "1",
      fields: "sid,domain_name,origination_urls",
    });

    expect(jsonFrom(log)).toMatchObject({
      has_more: true,
      pagination_key: "PAGE2",
      items: [
        {
          sid: TRUNK_SID,
          domain_name: "example.pstn.twilio.com",
          origination_urls: [
            {
              sid: ORIGINATION_SID,
              sip_url: "sip:example.pstn.example.com",
              enabled: true,
              priority: 10,
              weight: 10,
            },
          ],
        },
      ],
    });

    await getTrunkCommand(TRUNK_SID);
    expect(jsonFrom(log)).toMatchObject({
      sid: TRUNK_SID,
      secure: true,
      transfer_mode: "enable-all",
      transfer_caller_id: "from-transferee",
      recording: { mode: "do-not-record", trim: "do-not-trim" },
      phone_numbers: [{ sid: NUMBER_SID, phone_number: PHONE }],
    });
  });

  it("dry-runs origination changes and read-back a real add and remove", async () => {
    await addOriginationCommand(TRUNK_SID_2, {
      sipUrl: "sip:backup.pstn.example.com",
      priority: "20",
      weight: "5",
      enabled: "false",
      friendlyName: "backup",
      dryRun: true,
    });
    expect(methods()).toEqual(["get"]);
    expect(jsonFrom(log)).toMatchObject({
      dry_run: true,
      trunk_sid: TRUNK_SID_2,
      before: [],
      after: [
        {
          sip_url: "sip:backup.pstn.example.com",
          priority: 20,
          weight: 5,
          enabled: false,
          friendly_name: "backup",
        },
      ],
    });

    await addOriginationCommand(TRUNK_SID_2, {
      sipUrl: "sip:backup.pstn.example.com",
      priority: "20",
      weight: "5",
      enabled: "false",
    });
    const post = http().requests.find(
      (request) => request.method.toLowerCase() === "post",
    );
    expect(post?.data).toMatchObject({
      SipUrl: "sip:backup.pstn.example.com",
      Priority: 20,
      Weight: 5,
      Enabled: "false",
      FriendlyName: "",
    });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: false,
      after: [{ sid: CREATED_ORIGINATION_SID, enabled: false }],
    });

    await removeOriginationCommand(TRUNK_SID, ORIGINATION_SID, {
      dryRun: true,
    });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: true,
      before: [{ sid: ORIGINATION_SID }],
      after: [],
    });
    expect(methods().filter((method) => method === "delete")).toEqual([]);

    await removeOriginationCommand(TRUNK_SID, ORIGINATION_SID);
    expect(jsonFrom(log)).toMatchObject({
      dry_run: false,
      after: [],
    });
    expect(methods()).toContain("delete");
  });

  it("rejects invalid writes and a missing origination URL before mutating", async () => {
    await expect(
      addOriginationCommand(TRUNK_SID, {
        sipUrl: "sips:example.pstn.example.com",
        priority: "1",
        weight: "1",
      }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    await expect(
      removeOriginationCommand(TRUNK_SID, `OU${"9".repeat(32)}`),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(
      methods().filter((method) => method === "post" || method === "delete"),
    ).toEqual([]);
    expect(jsonFrom(error)).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("fails origination reconciliation when the follow-up read disagrees", async () => {
    http().setIgnoreMutations(true);
    await expect(
      addOriginationCommand(TRUNK_SID_2, {
        sipUrl: "sip:backup.pstn.example.com",
        priority: "1",
        weight: "1",
      }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({
      error: { code: "RECONCILIATION_FAILED", retryable: false },
    });
  });

  it("filters calls and gets one call", async () => {
    await listCallsCommand({
      from: PHONE,
      to: "+15555550199",
      status: "completed",
      startAfter: "2026-10-10T00:00:00Z",
      startBefore: "2026-10-10T13:00:00Z",
      limit: "20",
      fields: "sid,status,start_time,trunk_sid",
    });

    expect(http().requests[0]?.params).toMatchObject({
      Status: "completed",
      "StartTime>": "2026-10-10T00:00:00Z",
      "StartTime<": "2026-10-10T13:00:00Z",
      PageSize: 20,
    });
    expect(http().requests[0]?.params).not.toHaveProperty("From");
    expect(http().requests[0]?.params).not.toHaveProperty("To");
    expect(jsonFrom(log)).toEqual({
      items: [
        {
          sid: CALL_SID,
          status: "completed",
          start_time: "2026-10-10T12:00:00.000Z",
          trunk_sid: TRUNK_SID,
        },
      ],
      has_more: false,
    });

    await getCallCommand(CALL_SID);
    expect(jsonFrom(log)).toMatchObject({
      sid: CALL_SID,
      from: PHONE,
      duration: "60",
      parent_call_sid: null,
    });
  });

  it("rejects an inverted call window and a missing call", async () => {
    await expect(
      listCallsCommand({
        startAfter: "2026-10-10T13:00:00Z",
        startBefore: "2026-10-10T00:00:00Z",
      }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(methods()).toEqual([]);

    await expect(getCallCommand(`CA${"d".repeat(32)}`)).rejects.toBeInstanceOf(
      ReportedCliError,
    );
    expect(jsonFrom(error)).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});
