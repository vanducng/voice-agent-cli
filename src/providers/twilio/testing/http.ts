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
  let failRule: FailRule | null = null;
  let ignoreMutations = false;

  function seed(): void {
    requests.length = 0;
    numbers.clear();
    trunks.clear();
    originations.clear();
    trunkNumbers.clear();
    calls.clear();
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
      const page = slicePage(items, params);
      return ok(page2010("calls", page, null));
    }

    const callMatch = path.match(/\/Calls\/(CA[0-9a-fA-F]{32})\.json$/);
    if (callMatch && method === "get") {
      const call = calls.get(callMatch[1]);
      return call ? ok(call) : ok({ message: "not found", code: 20404 }, 404);
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
