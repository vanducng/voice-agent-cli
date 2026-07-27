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
    filterFields: vi.fn((data, _fields) => data),
  };
});

describe("updateLiveCallCommand", () => {
  const response = { call_id: "call_1", call_status: "ongoing" };
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

  it("requires dynamic variables", async () => {
    await updateLiveCallCommand("call_1", {});

    expect(outputFormatter.handleSdkError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ValidationError" }),
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it("filters response fields", async () => {
    await updateLiveCallCommand("call_1", {
      dynamicVariables: '{"name":"Jane"}',
      fields: "call_id",
    });

    expect(outputFormatter.filterFields).toHaveBeenCalledWith(response, [
      "call_id",
    ]);
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
