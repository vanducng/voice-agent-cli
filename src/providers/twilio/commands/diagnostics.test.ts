import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportedCliError } from "../../../core/cli-response";
import { listAlertsCommand } from "./alerts/list";
import { getAlertCommand } from "./alerts/get";
import { listCallEventsCommand } from "./calls/events";
import { getCallCommand } from "./calls/get";
import { getMessageCommand } from "./messages/get";
import { listMessagesCommand } from "./messages/list";
import { getServiceCommand } from "./messaging-services/get";
import { getRecordingCommand } from "./recordings/get";
import { listRecordingsCommand } from "./recordings/list";
import { associateCredentialCommand } from "./trunks/credentials";
import { listCredentialsCommand } from "./trunks/credentials";
import { listIpAccessControlListsCommand } from "./trunks/ip-access-control-lists";
import { updateOriginationCommand } from "./trunks/origination-update";
import { updateTrunkCommand } from "./trunks/update";
import { getTrunkCommand } from "./trunks/get";
import {
  ACCOUNT,
  ALERT_SID,
  CALL_SID,
  CREDENTIAL_SID,
  CREATED_CREDENTIAL_SID,
  IP_ACL_SID,
  IP_ADDRESS_SID,
  MESSAGE_SID,
  NUMBER_SID,
  ORIGINATION_SID,
  PHONE,
  RECORDING_SID,
  SERVICE_SID,
  TOKEN,
  TRUNK_SID,
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

describe("twilio diagnostics", () => {
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

  it("returns trunk auth and disaster-recovery fields", async () => {
    await getTrunkCommand(TRUNK_SID, {
      fields:
        "sid,auth_type,disaster_recovery_url,disaster_recovery_method,cnam_lookup_enabled,symmetric_rtp_enabled",
    });
    expect(jsonFrom(log)).toEqual({
      sid: TRUNK_SID,
      auth_type: "IP_ACL",
      disaster_recovery_url: "https://example.com/disaster",
      disaster_recovery_method: "POST",
      cnam_lookup_enabled: false,
      symmetric_rtp_enabled: false,
    });
  });

  it("dry-runs an origination update with reads only, then posts the change", async () => {
    await updateOriginationCommand(TRUNK_SID, ORIGINATION_SID, {
      enabled: "false",
      dryRun: true,
    });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: true,
      after: [{ sid: ORIGINATION_SID, enabled: false }],
    });
    expect(methods().every((method) => method === "get")).toBe(true);

    installHttp();
    await updateOriginationCommand(TRUNK_SID, ORIGINATION_SID, {
      enabled: "false",
    });
    const posts = http().requests.filter(
      (request) => request.method.toLowerCase() === "post",
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]?.data).toMatchObject({ Enabled: "false" });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: false,
      after: [{ sid: ORIGINATION_SID, enabled: false }],
    });
  });

  it("lists credential associations and dry-runs a new association without posting", async () => {
    await listCredentialsCommand(TRUNK_SID);
    expect(jsonFrom(log)).toMatchObject({
      items: [{ sid: CREDENTIAL_SID, friendly_name: "primary" }],
    });
    expect(JSON.stringify(jsonFrom(log))).not.toContain("password");

    installHttp();
    await associateCredentialCommand(TRUNK_SID, {
      credentialList: CREATED_CREDENTIAL_SID,
      dryRun: true,
    });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: true,
      after: [
        { sid: CREDENTIAL_SID },
        { sid: CREATED_CREDENTIAL_SID, friendly_name: null },
      ],
    });
    expect(methods()).not.toContain("post");
  });

  it("lists IP access control lists with their addresses", async () => {
    await listIpAccessControlListsCommand(TRUNK_SID);
    expect(jsonFrom(log)).toMatchObject({
      items: [
        {
          sid: IP_ACL_SID,
          friendly_name: "office",
          addresses: [
            {
              sid: IP_ADDRESS_SID,
              ip_address: "203.0.113.10",
              cidr_prefix_length: 32,
            },
          ],
        },
      ],
    });
  });

  it("omits message bodies unless --include-body is set", async () => {
    await listMessagesCommand({ fields: "sid,status,direction" });
    expect(jsonFrom(log)).toEqual({
      items: [
        { sid: MESSAGE_SID, status: "delivered", direction: "outbound-api" },
      ],
      has_more: false,
    });
    expect(JSON.stringify(jsonFrom(log))).not.toContain("hello applicant");

    await expect(
      getMessageCommand(MESSAGE_SID, { fields: "body" }),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({
      error: { code: "VALIDATION_ERROR", retryable: false },
    });

    await getMessageCommand(MESSAGE_SID, { includeBody: true });
    expect(jsonFrom(log)).toMatchObject({ body: "hello applicant" });
  });

  it("includes sender-pool numbers on a messaging service", async () => {
    await getServiceCommand(SERVICE_SID);
    expect(jsonFrom(log)).toMatchObject({
      sid: SERVICE_SID,
      phone_numbers: [{ sid: NUMBER_SID, phone_number: PHONE }],
    });
  });

  it("omits alert request variables and response bodies", async () => {
    await listAlertsCommand({ logLevel: "error" });
    const listed = JSON.stringify(jsonFrom(log));
    expect(listed).not.toContain("request_variables");
    expect(listed).not.toContain("secret-body");
    expect(listed).not.toContain(TOKEN);
    expect(jsonFrom(log)).toMatchObject({
      items: [{ sid: ALERT_SID, error_code: "11200", log_level: "error" }],
    });

    await getAlertCommand(ALERT_SID);
    const detailed = JSON.stringify(jsonFrom(log));
    expect(detailed).toContain("HTTP retrieval failure");
    expect(detailed).not.toContain("request_variables");
    expect(detailed).not.toContain("secret-body");
    expect(detailed).not.toContain(TOKEN);
  });

  it("returns recording metadata without a media URL", async () => {
    await listRecordingsCommand({ call: CALL_SID });
    expect(JSON.stringify(jsonFrom(log))).not.toContain("secret-media");
    expect(JSON.stringify(jsonFrom(log))).not.toContain("media_url");
    expect(jsonFrom(log)).toMatchObject({
      items: [{ sid: RECORDING_SID, call_sid: CALL_SID, status: "completed" }],
    });

    await getRecordingCommand(RECORDING_SID);
    expect(JSON.stringify(jsonFrom(log))).not.toContain("secret-media");
  });

  it("returns answered_by and queue_time, and redacts call event secrets", async () => {
    await getCallCommand(CALL_SID, { fields: "sid,answered_by,queue_time" });
    expect(jsonFrom(log)).toEqual({
      sid: CALL_SID,
      answered_by: "human",
      queue_time: "20",
    });

    await listCallEventsCommand(CALL_SID);
    const events = JSON.stringify(jsonFrom(log));
    expect(events).not.toContain(TOKEN);
    expect(events).toContain("[REDACTED]");

    await expect(
      listCallEventsCommand(`CA${"9".repeat(32)}`),
    ).rejects.toBeInstanceOf(ReportedCliError);
    expect(jsonFrom(error)).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Call events were not found.",
        next_steps: [
          "Wait about 15 minutes after a Programmable Voice call ends, then retry.",
          "Elastic SIP trunk calls do not have this subresource.",
        ],
      },
    });
  });

  it("dry-runs a trunk recording change, then posts the Recording subresource", async () => {
    await updateTrunkCommand(TRUNK_SID, {
      recordingMode: "record-from-answer",
      dryRun: true,
    });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: true,
      after: { recording: { mode: "record-from-answer" } },
    });
    expect(methods()).not.toContain("post");

    installHttp();
    await updateTrunkCommand(TRUNK_SID, {
      recordingMode: "record-from-answer",
    });
    const posts = http().requests.filter(
      (request) => request.method.toLowerCase() === "post",
    );
    expect(posts.map((request) => request.uri)).toEqual([
      expect.stringContaining(`/Trunks/${TRUNK_SID}/Recording`),
    ]);
    expect(posts[0]?.data).toMatchObject({ Mode: "record-from-answer" });
    expect(jsonFrom(log)).toMatchObject({
      dry_run: false,
      after: { recording: { mode: "record-from-answer" } },
    });
  });
});
