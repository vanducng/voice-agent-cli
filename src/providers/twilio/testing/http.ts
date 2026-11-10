export const ACCOUNT = `AC${"1".repeat(32)}`;
export const TOKEN = "auth-token-value-not-real";
export const API_KEY = `SK${"b".repeat(32)}`;
export const API_SECRET = "api-secret-value-not-real";
export const NUMBER_SID = `PN${"2".repeat(32)}`;
export const NUMBER_SID_2 = `PN${"a".repeat(32)}`;
export const TRUNK_SID = `TK${"3".repeat(32)}`;
export const TRUNK_SID_2 = `TK${"4".repeat(32)}`;
export const ORIGINATION_SID = `OU${"5".repeat(32)}`;
export const CREATED_ORIGINATION_SID = `OU${"7".repeat(32)}`;
export const CALL_SID = `CA${"6".repeat(32)}`;
export const CALL_SID_2 = `CA${"8".repeat(32)}`;
export const TRUNK_CALL_SID = `CA${"e".repeat(32)}`;
export const TRUNK_CALL_SID_2 = `CA${"f".repeat(32)}`;
export const TRUNK_SIP_TO = `:+${"15555550100"}@sip.example.com`;
export const TRUNK_SIP_FROM = "sip:+15555550102@sip.example.com";
export const CREDENTIAL_SID = `CL${"c".repeat(32)}`;
export const CREATED_CREDENTIAL_SID = `CL${"d".repeat(32)}`;
export const IP_ACL_SID = `AL${"e".repeat(32)}`;
export const CREATED_IP_ACL_SID = `AL${"f".repeat(32)}`;
export const IP_ADDRESS_SID = `IP${"9".repeat(32)}`;
export const MESSAGE_SID = `SM${"a".repeat(32)}`;
export const SERVICE_SID = `MG${"b".repeat(32)}`;
export const ALERT_SID = `NO${"c".repeat(32)}`;
export const RECORDING_SID = `RE${"d".repeat(32)}`;
export const PHONE = "+15555550100";
export const PHONE_2 = "+15555550101";

export interface RecordedRequest {
  method: string;
  uri: string;
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
  username?: string;
  password?: string;
}

interface FailRule {
  method: string;
  statusCode: number;
  message: string;
}

type Json = Record<string, unknown>;

function numberPayload(overrides: Json = {}): Json {
  return {
    sid: NUMBER_SID,
    phone_number: PHONE,
    friendly_name: "Main",
    trunk_sid: TRUNK_SID,
    voice_url: "",
    voice_method: "POST",
    voice_application_sid: "",
    sms_url: "https://example.com/sms",
    status_callback: "",
    ...overrides,
  };
}

function trunkPayload(overrides: Json = {}): Json {
  return {
    sid: TRUNK_SID,
    domain_name: "example.pstn.twilio.com",
    friendly_name: "Primary",
    secure: true,
    transfer_mode: "enable-all",
    transfer_caller_id: "from-transferee",
    recording: { mode: "do-not-record", trim: "do-not-trim" },
    auth_type: "IP_ACL",
    disaster_recovery_url: "https://example.com/disaster",
    disaster_recovery_method: "POST",
    cnam_lookup_enabled: false,
    symmetric_rtp_enabled: false,
    ...overrides,
  };
}

function originationPayload(overrides: Json = {}): Json {
  return {
    sid: ORIGINATION_SID,
    sip_url: "sip:example.pstn.example.com",
    enabled: true,
    priority: 10,
    weight: 10,
    friendly_name: "retell",
    ...overrides,
  };
}

function callPayload(overrides: Json = {}): Json {
  return {
    sid: CALL_SID,
    from: PHONE,
    to: "+15555550199",
    status: "completed",
    direction: "inbound",
    start_time: "Thu, 10 Oct 2026 12:00:00 +0000",
    end_time: "Thu, 10 Oct 2026 12:01:00 +0000",
    duration: "60",
    trunk_sid: TRUNK_SID,
    phone_number_sid: NUMBER_SID,
    parent_call_sid: "",
    answered_by: "human",
    queue_time: "20",
    ...overrides,
  };
}

function page2010(key: string, items: Json[], nextPath: string | null): Json {
  return {
    [key]: items,
    end: items.length,
    first_page_uri: "/2010-04-01/Accounts",
    next_page_uri: nextPath,
    page: 0,
    page_size: items.length,
    previous_page_uri: null,
    uri: "/2010-04-01/Accounts",
  };
}

function pageV1(key: string, items: Json[], nextUrl: string | null): Json {
  return {
    meta: {
      key,
      next_page_url: nextUrl,
      previous_page_url: null,
      page: 0,
      page_size: items.length,
    },
    [key]: items,
  };
}

function ok(body: unknown, statusCode = 200) {
  return { statusCode, body, headers: {} };
}

function slicePage<T>(
  items: T[],
  params: Record<string, unknown> | undefined,
): T[] {
  const pageSize = Number(params?.PageSize ?? items.length) || items.length;
  const start = params?.PageToken === "PAGE2" ? pageSize : 0;
  return items.slice(start, start + pageSize);
}

export function createTwilioHttp() {
  const requests: RecordedRequest[] = [];
  const numbers = new Map<string, Json>();
  const trunks = new Map<string, Json>();
  const originations = new Map<string, Json[]>();
  const trunkNumbers = new Map<string, Json[]>();
  const calls = new Map<string, Json>();
  const credentials = new Map<string, Json[]>();
  const ipAcls = new Map<string, Json[]>();
  const messages = new Map<string, Json>();
  const services = new Map<string, Json>();
  const alerts = new Map<string, Json>();
  const recordings = new Map<string, Json>();
  let failRule: FailRule | null = null;
  let ignoreMutations = false;

  function seed(): void {
    requests.length = 0;
    numbers.clear();
    trunks.clear();
    originations.clear();
    trunkNumbers.clear();
    calls.clear();
    credentials.clear();
    ipAcls.clear();
    messages.clear();
    services.clear();
    alerts.clear();
    recordings.clear();
    failRule = null;
    ignoreMutations = false;
    numbers.set(NUMBER_SID, numberPayload());
    numbers.set(
      NUMBER_SID_2,
      numberPayload({
        sid: NUMBER_SID_2,
        phone_number: PHONE_2,
        friendly_name: "Other",
        trunk_sid: "",
      }),
    );
    trunks.set(TRUNK_SID, trunkPayload());
    trunks.set(
      TRUNK_SID_2,
      trunkPayload({
        sid: TRUNK_SID_2,
        domain_name: "backup.pstn.twilio.com",
        friendly_name: "Backup",
        secure: false,
      }),
    );
    originations.set(TRUNK_SID, [originationPayload()]);
    originations.set(TRUNK_SID_2, []);
    trunkNumbers.set(TRUNK_SID, [
      { sid: NUMBER_SID, phone_number: PHONE, friendly_name: "Main" },
    ]);
    trunkNumbers.set(TRUNK_SID_2, []);
    calls.set(CALL_SID, callPayload());
    credentials.set(TRUNK_SID, [
      {
        sid: CREDENTIAL_SID,
        friendly_name: "primary",
        trunk_sid: TRUNK_SID,
      },
    ]);
    credentials.set(TRUNK_SID_2, []);
    ipAcls.set(TRUNK_SID, [
      { sid: IP_ACL_SID, friendly_name: "office", trunk_sid: TRUNK_SID },
    ]);
    ipAcls.set(TRUNK_SID_2, []);
    messages.set(MESSAGE_SID, {
      sid: MESSAGE_SID,
      to: PHONE,
      from: PHONE_2,
      body: "hello applicant",
      status: "delivered",
      direction: "outbound-api",
      error_code: null,
      error_message: null,
      messaging_service_sid: SERVICE_SID,
      num_segments: "1",
      date_sent: "Thu, 10 Oct 2026 12:00:00 +0000",
      date_created: "Thu, 10 Oct 2026 12:00:00 +0000",
    });
    services.set(SERVICE_SID, {
      sid: SERVICE_SID,
      friendly_name: "Outreach",
      usecase: "notifications",
      inbound_request_url: "https://example.com/inbound",
      status_callback: "https://example.com/status",
    });
    alerts.set(ALERT_SID, {
      sid: ALERT_SID,
      error_code: "11200",
      log_level: "error",
      resource_sid: CALL_SID,
      request_url: "https://example.com/voice",
      date_generated: "Thu, 10 Oct 2026 12:00:00 +0000",
      alert_text: "HTTP retrieval failure",
      more_info: "https://www.twilio.com/docs/api/errors/11200",
      request_variables: `auth_token=${TOKEN}`,
      response_body: "secret-body",
    });
    recordings.set(RECORDING_SID, {
      sid: RECORDING_SID,
      call_sid: CALL_SID,
      status: "completed",
      duration: "60",
      channels: 1,
      source: "Trunking",
      start_time: "Thu, 10 Oct 2026 12:00:00 +0000",
      error_code: null,
      media_url: "https://api.twilio.com/secret-media",
    });
    calls.set(
      CALL_SID_2,
      callPayload({
        sid: CALL_SID_2,
        from: PHONE_2,
        to: "+15555550198",
        status: "failed",
        start_time: "Wed, 09 Oct 2026 12:00:00 +0000",
        end_time: "Wed, 09 Oct 2026 12:00:05 +0000",
        duration: "5",
        trunk_sid: "",
        phone_number_sid: NUMBER_SID_2,
      }),
    );
    calls.set(
      TRUNK_CALL_SID,
      callPayload({
        sid: TRUNK_CALL_SID,
        from: TRUNK_SIP_FROM,
        to: TRUNK_SIP_TO,
        status: "completed",
        direction: "trunking-originating",
        start_time: "Thu, 10 Oct 2026 12:05:00 +0000",
        end_time: "Thu, 10 Oct 2026 12:06:00 +0000",
        duration: "60",
      }),
    );
    calls.set(
      TRUNK_CALL_SID_2,
      callPayload({
        sid: TRUNK_CALL_SID_2,
        from: PHONE_2,
        to: TRUNK_SIP_TO,
        status: "completed",
        direction: "trunking-originating",
        start_time: "Thu, 10 Oct 2026 12:07:00 +0000",
        end_time: "Thu, 10 Oct 2026 12:08:00 +0000",
        duration: "60",
      }),
    );
  }

  function dispatch(opts: RecordedRequest) {
    const url = new URL(opts.uri);
    const path = url.pathname;
    const method = opts.method.toLowerCase();
    const params = opts.params ?? {};
    const data = opts.data ?? {};

    if (path === `/2010-04-01/Accounts/${ACCOUNT}.json` && method === "get") {
      return ok({ sid: ACCOUNT, status: "active" });
    }

    if (path.endsWith("/IncomingPhoneNumbers.json") && method === "get") {
      let items = [...numbers.values()];
      if (params.PhoneNumber) {
        items = items.filter(
          (item) => item.phone_number === params.PhoneNumber,
        );
      }
      const page = slicePage(items, params);
      const hasMore =
        (params.PageToken === "PAGE2" ? Number(params.PageSize) : 0) +
          page.length <
        items.length;
      return ok(
        page2010(
          "incoming_phone_numbers",
          page,
          hasMore
            ? `/2010-04-01/Accounts/${ACCOUNT}/IncomingPhoneNumbers.json?PageToken=PAGE2`
            : null,
        ),
      );
    }

    const numberMatch = path.match(
      /\/IncomingPhoneNumbers\/(PN[0-9a-fA-F]{32})\.json$/,
    );
    if (numberMatch && method === "get") {
      const number = numbers.get(numberMatch[1]);
      return number
        ? ok(number)
        : ok({ message: "not found", code: 20404 }, 404);
    }
    if (numberMatch && method === "post") {
      const number = numbers.get(numberMatch[1]);
      if (!number) return ok({ message: "not found", code: 20404 }, 404);
      if (!ignoreMutations && data.TrunkSid !== undefined) {
        number.trunk_sid = data.TrunkSid;
      }
      return ok(number);
    }

    if (path === "/v1/Trunks" && method === "get") {
      const items = [...trunks.values()];
      const page = slicePage(items, params);
      const hasMore =
        (params.PageToken === "PAGE2" ? Number(params.PageSize) : 0) +
          page.length <
        items.length;
      return ok(
        pageV1(
          "trunks",
          page,
          hasMore
            ? "https://trunking.twilio.com/v1/Trunks?PageToken=PAGE2"
            : null,
        ),
      );
    }

    const trunkMatch = path.match(/\/v1\/Trunks\/(TK[0-9a-fA-F]{32})$/);
    if (trunkMatch && method === "get") {
      const trunk = trunks.get(trunkMatch[1]);
      return trunk ? ok(trunk) : ok({ message: "not found", code: 20404 }, 404);
    }
    if (trunkMatch && method === "post") {
      const trunk = trunks.get(trunkMatch[1]);
      if (!trunk) return ok({ message: "not found", code: 20404 }, 404);
      if (!ignoreMutations) {
        if (data.DisasterRecoveryUrl !== undefined) {
          trunk.disaster_recovery_url = data.DisasterRecoveryUrl;
        }
        if (data.DisasterRecoveryMethod !== undefined) {
          trunk.disaster_recovery_method = data.DisasterRecoveryMethod;
        }
        if (data.Secure !== undefined) trunk.secure = data.Secure !== "false";
        if (data.CnamLookupEnabled !== undefined) {
          trunk.cnam_lookup_enabled = data.CnamLookupEnabled !== "false";
        }
        if (data.TransferMode !== undefined) {
          trunk.transfer_mode = data.TransferMode;
        }
        if (data.TransferCallerId !== undefined) {
          trunk.transfer_caller_id = data.TransferCallerId;
        }
      }
      return ok(trunk);
    }

    const recordingSettings = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/Recording$/,
    );
    if (recordingSettings && method === "post") {
      const trunk = trunks.get(recordingSettings[1]);
      if (!trunk) return ok({ message: "not found", code: 20404 }, 404);
      const recording = trunk.recording as Json;
      if (!ignoreMutations) {
        if (data.Mode !== undefined) recording.mode = data.Mode;
        if (data.Trim !== undefined) recording.trim = data.Trim;
      }
      return ok(recording);
    }

    const originationList = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/OriginationUrls$/,
    );
    if (originationList && method === "get") {
      return ok(
        pageV1(
          "origination_urls",
          originations.get(originationList[1]) ?? [],
          null,
        ),
      );
    }
    if (originationList && method === "post") {
      const created = originationPayload({
        sid: CREATED_ORIGINATION_SID,
        sip_url: data.SipUrl,
        priority: Number(data.Priority),
        weight: Number(data.Weight),
        enabled: data.Enabled !== "false",
        friendly_name: data.FriendlyName || "",
      });
      if (!ignoreMutations) {
        originations.set(originationList[1], [
          ...(originations.get(originationList[1]) ?? []),
          created,
        ]);
      }
      return ok(created, 201);
    }

    const originationOne = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/OriginationUrls\/(OU[0-9a-fA-F]{32})$/,
    );
    if (originationOne && method === "post") {
      const items = originations.get(originationOne[1]) ?? [];
      const current = items.find((item) => item.sid === originationOne[2]);
      if (!current) return ok({ message: "not found", code: 20404 }, 404);
      if (!ignoreMutations) {
        if (data.SipUrl !== undefined) current.sip_url = data.SipUrl;
        if (data.Priority !== undefined)
          current.priority = Number(data.Priority);
        if (data.Weight !== undefined) current.weight = Number(data.Weight);
        if (data.Enabled !== undefined)
          current.enabled = data.Enabled !== "false";
        if (data.FriendlyName !== undefined) {
          current.friendly_name = data.FriendlyName;
        }
      }
      return ok(current);
    }
    if (originationOne && method === "delete") {
      if (!ignoreMutations) {
        originations.set(
          originationOne[1],
          (originations.get(originationOne[1]) ?? []).filter(
            (item) => item.sid !== originationOne[2],
          ),
        );
      }
      return ok({}, 204);
    }

    const trunkNumberList = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/PhoneNumbers$/,
    );
    if (trunkNumberList && method === "get") {
      return ok(
        pageV1(
          "phone_numbers",
          trunkNumbers.get(trunkNumberList[1]) ?? [],
          null,
        ),
      );
    }

    if (path.endsWith("/Calls.json") && method === "get") {
      let items = [...calls.values()];
      if (params.From)
        items = items.filter((item) => item.from === params.From);
      if (params.To) items = items.filter((item) => item.to === params.To);
      if (params.Status)
        items = items.filter((item) => item.status === params.Status);
      const after = params["StartTime>"]
        ? Date.parse(String(params["StartTime>"]))
        : undefined;
      const before = params["StartTime<"]
        ? Date.parse(String(params["StartTime<"]))
        : undefined;
      items = items.filter((item) => {
        const start = Date.parse(String(item.start_time));
        if (after !== undefined && start < after) return false;
        if (before !== undefined && start >= before) return false;
        return true;
      });
      const pageSize = Number(params.PageSize ?? items.length) || items.length;
      const token = params.PageToken ? String(params.PageToken) : "";
      const start = token.startsWith("offset:") ? Number(token.slice(7)) : 0;
      const page = items.slice(start, start + pageSize);
      const nextStart = start + page.length;
      return ok(
        page2010(
          "calls",
          page,
          nextStart < items.length
            ? `/2010-04-01/Accounts/${ACCOUNT}/Calls.json?PageToken=offset:${nextStart}`
            : null,
        ),
      );
    }

    const callMatch = path.match(/\/Calls\/(CA[0-9a-fA-F]{32})\.json$/);
    if (callMatch && method === "get") {
      const call = calls.get(callMatch[1]);
      return call ? ok(call) : ok({ message: "not found", code: 20404 }, 404);
    }

    const eventList = path.match(/\/Calls\/(CA[0-9a-fA-F]{32})\/Events\.json$/);
    if (eventList && method === "get") {
      if (!calls.has(eventList[1])) {
        return ok({ message: "not found", code: 20404 }, 404);
      }
      return ok(
        page2010(
          "events",
          [
            {
              request: {
                method: "POST",
                url: "https://example.com/hook",
                parameters: { auth_token: TOKEN },
              },
              response: { response_code: 200, response_body: "ok" },
            },
          ],
          null,
        ),
      );
    }

    const credentialList = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/CredentialLists$/,
    );
    if (credentialList && method === "get") {
      return ok(
        pageV1(
          "credential_lists",
          credentials.get(credentialList[1]) ?? [],
          null,
        ),
      );
    }
    if (credentialList && method === "post") {
      const created = {
        sid: String(data.CredentialListSid),
        friendly_name: "",
        trunk_sid: credentialList[1],
      };
      if (!ignoreMutations) {
        credentials.set(credentialList[1], [
          ...(credentials.get(credentialList[1]) ?? []),
          created,
        ]);
      }
      return ok(created, 201);
    }
    const credentialOne = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/CredentialLists\/(CL[0-9a-fA-F]{32})$/,
    );
    if (credentialOne && method === "delete") {
      if (!ignoreMutations) {
        credentials.set(
          credentialOne[1],
          (credentials.get(credentialOne[1]) ?? []).filter(
            (item) => item.sid !== credentialOne[2],
          ),
        );
      }
      return ok({}, 204);
    }

    const ipAclList = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/IpAccessControlLists$/,
    );
    if (ipAclList && method === "get") {
      return ok(
        pageV1("ip_access_control_lists", ipAcls.get(ipAclList[1]) ?? [], null),
      );
    }
    if (ipAclList && method === "post") {
      const created = {
        sid: String(data.IpAccessControlListSid),
        friendly_name: "",
        trunk_sid: ipAclList[1],
      };
      if (!ignoreMutations) {
        ipAcls.set(ipAclList[1], [
          ...(ipAcls.get(ipAclList[1]) ?? []),
          created,
        ]);
      }
      return ok(created, 201);
    }
    const ipAclOne = path.match(
      /\/v1\/Trunks\/(TK[0-9a-fA-F]{32})\/IpAccessControlLists\/(AL[0-9a-fA-F]{32})$/,
    );
    if (ipAclOne && method === "delete") {
      if (!ignoreMutations) {
        ipAcls.set(
          ipAclOne[1],
          (ipAcls.get(ipAclOne[1]) ?? []).filter(
            (item) => item.sid !== ipAclOne[2],
          ),
        );
      }
      return ok({}, 204);
    }

    const ipAddresses = path.match(
      /\/SIP\/IpAccessControlLists\/(AL[0-9a-fA-F]{32})\/IpAddresses\.json$/,
    );
    if (ipAddresses && method === "get") {
      const known = [...ipAcls.values()].some((lists) =>
        lists.some((item) => item.sid === ipAddresses[1]),
      );
      return ok(
        page2010(
          "ip_addresses",
          known
            ? [
                {
                  sid: IP_ADDRESS_SID,
                  ip_address: "203.0.113.10",
                  cidr_prefix_length: 32,
                  friendly_name: "pbx",
                },
              ]
            : [],
          null,
        ),
      );
    }

    if (path.endsWith("/Messages.json") && method === "get") {
      let items = [...messages.values()];
      if (params.To) items = items.filter((item) => item.to === params.To);
      if (params.From)
        items = items.filter((item) => item.from === params.From);
      return ok(page2010("messages", items, null));
    }
    const messageOne = path.match(
      /\/Messages\/((?:SM|MM)[0-9a-fA-F]{32})\.json$/,
    );
    if (messageOne && method === "get") {
      const message = messages.get(messageOne[1]);
      return message
        ? ok(message)
        : ok({ message: "not found", code: 20404 }, 404);
    }

    if (path === "/v1/Services" && method === "get") {
      return ok(pageV1("services", [...services.values()], null));
    }
    const serviceOne = path.match(/\/v1\/Services\/(MG[0-9a-fA-F]{32})$/);
    if (serviceOne && method === "get") {
      const service = services.get(serviceOne[1]);
      return service
        ? ok(service)
        : ok({ message: "not found", code: 20404 }, 404);
    }
    const serviceNumbers = path.match(
      /\/v1\/Services\/(MG[0-9a-fA-F]{32})\/PhoneNumbers$/,
    );
    if (serviceNumbers && method === "get") {
      if (!services.has(serviceNumbers[1])) {
        return ok({ message: "not found", code: 20404 }, 404);
      }
      return ok(
        pageV1(
          "phone_numbers",
          [
            {
              sid: NUMBER_SID,
              phone_number: PHONE,
              service_sid: serviceNumbers[1],
            },
          ],
          null,
        ),
      );
    }

    if (path === "/v1/Alerts" && method === "get") {
      let items = [...alerts.values()];
      if (params.LogLevel) {
        items = items.filter((item) => item.log_level === params.LogLevel);
      }
      return ok(pageV1("alerts", items, null));
    }
    const alertOne = path.match(/\/v1\/Alerts\/(NO[0-9a-fA-F]{32})$/);
    if (alertOne && method === "get") {
      const alert = alerts.get(alertOne[1]);
      return alert ? ok(alert) : ok({ message: "not found", code: 20404 }, 404);
    }

    if (path.endsWith("/Recordings.json") && method === "get") {
      let items = [...recordings.values()];
      if (params.CallSid) {
        items = items.filter((item) => item.call_sid === params.CallSid);
      }
      return ok(page2010("recordings", items, null));
    }
    const recordingOne = path.match(/\/Recordings\/(RE[0-9a-fA-F]{32})\.json$/);
    if (recordingOne && method === "get") {
      const recording = recordings.get(recordingOne[1]);
      return recording
        ? ok(recording)
        : ok({ message: "not found", code: 20404 }, 404);
    }

    return ok({ message: `unhandled ${method} ${path}`, code: 0 }, 500);
  }

  const httpClient = {
    request(opts: RecordedRequest) {
      const recorded = {
        method: opts.method,
        uri: opts.uri,
        params: opts.params,
        data: opts.data,
        username: opts.username,
        password: opts.password,
      };
      requests.push(recorded);
      if (failRule && recorded.method.toLowerCase() === failRule.method) {
        const failure = failRule;
        failRule = null;
        return Promise.resolve(
          ok(
            { message: failure.message, code: failure.statusCode },
            failure.statusCode,
          ),
        );
      }
      return Promise.resolve(dispatch(recorded));
    },
  };

  seed();

  return {
    httpClient,
    requests,
    seed,
    numbers,
    failOn(method: string, statusCode: number, message: string) {
      failRule = { method, statusCode, message };
    },
    rejectOn(method: string, error: Error) {
      const original = httpClient.request;
      httpClient.request = (opts) => {
        requests.push(opts);
        if (opts.method.toLowerCase() === method) {
          httpClient.request = original;
          return Promise.reject(error);
        }
        return original(opts);
      };
    },
    setIgnoreMutations(value: boolean) {
      ignoreMutations = value;
    },
  };
}

let current = createTwilioHttp();

export function installHttp() {
  current = createTwilioHttp();
  return current;
}

export function http() {
  return current;
}
