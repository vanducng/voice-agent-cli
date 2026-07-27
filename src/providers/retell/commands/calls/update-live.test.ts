import { beforeEach, describe, expect, it, vi } from "vitest";
import * as retellClient from "../../services/retell-client";
import * as outputFormatter from "../../services/output-formatter";
import { updateLiveCallCommand } from "./update-live";

vi.mock("../../services/retell-client");
vi.mock("../../services/output-formatter", async () => {
  const actual = await vi.importActual("../../services/output-formatter");
  return {
    ...actual,
    outputJson: vi.fn(),
    handleSdkError: vi.fn(),
  };
});

describe("updateLiveCallCommand", () => {
  const response = { success: true };
  const patch = vi.fn().mockResolvedValue(response);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(retellClient.getRetellClient).mockReturnValue({ patch } as never);
  });

  it("updates live dynamic variables", async () => {
    await updateLiveCallCommand("call/1", {
      dynamicVariables: '{"name":"Jane"}',
    });

    expect(patch).toHaveBeenCalledWith("/v2/update-live-call/call%2F1", {
      body: {
        fields_to_override: {
          override_dynamic_variables: { name: "Jane" },
        },
      },
    });
    expect(outputFormatter.outputJson).toHaveBeenCalledWith(response);
  });

  it("clears live dynamic variables with null", async () => {
    await updateLiveCallCommand("call_1", {
      dynamicVariables: "null",
    });

    expect(patch).toHaveBeenCalledWith("/v2/update-live-call/call_1", {
      body: {
        fields_to_override: {
          override_dynamic_variables: null,
        },
      },
    });
  });

  it("combines every current live-call override", async () => {
    await updateLiveCallCommand("call_1", {
      dynamicVariables: '{"name":"Jane"}',
      metadata: '{"ticket_id":"ticket_1"}',
      dataStorageSetting: "everything_except_pii",
      additionalContext: "The customer opened a billing ticket.",
      triggerResponse: true,
    });

    expect(patch).toHaveBeenCalledWith("/v2/update-live-call/call_1", {
      body: {
        fields_to_override: {
          override_dynamic_variables: { name: "Jane" },
          metadata: { ticket_id: "ticket_1" },
          data_storage_setting: "everything_except_pii",
        },
        call_control: {
          additional_context: "The customer opened a billing ticket.",
          trigger_response: true,
        },
      },
    });
  });

  it("omits empty request sections", async () => {
    await updateLiveCallCommand("call_1", {
      triggerResponse: true,
    });

    expect(patch).toHaveBeenCalledWith("/v2/update-live-call/call_1", {
      body: {
        call_control: {
          trigger_response: true,
        },
      },
    });
  });

  it("requires at least one mutation flag", async () => {
    await updateLiveCallCommand("call_1", {});

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it.each([
    [{ metadata: "[]" }, "--metadata must be a JSON object"],
    [
      { dataStorageSetting: "archive_forever" },
      "--data-storage-setting must be one of",
    ],
    [{ additionalContext: "   " }, "--additional-context must not be empty"],
  ] as const)("rejects invalid options", async (options, message) => {
    await updateLiveCallCommand("call_1", options);

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ValidationError",
        message: expect.stringContaining(message),
      }),
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it("delegates SDK errors", async () => {
    const error = new Error("request failed");
    patch.mockRejectedValueOnce(error);

    await updateLiveCallCommand("call_1", {
      dynamicVariables: '{"name":"Jane"}',
    });

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(error);
  });
});
