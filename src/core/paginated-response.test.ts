import { describe, expect, it } from "vitest";
import {
  getPaginatedItems,
  withPaginationMetadata,
} from "./paginated-response";

describe("getPaginatedItems", () => {
  it("returns items from unified paginated responses", () => {
    expect(
      getPaginatedItems({
        items: [{ id: "one" }, { id: "two" }],
        has_more: true,
        pagination_key: "next",
      }),
    ).toEqual([{ id: "one" }, { id: "two" }]);
  });

  it("rejects responses outside the current items contract", () => {
    expect(() => getPaginatedItems({ has_more: false })).toThrow(
      "expected the current paginated items[] contract",
    );
  });

  it("always returns the current response envelope", () => {
    expect(
      withPaginationMetadata({ items: [{ id: "one" }] }, [{ id: "one" }]),
    ).toEqual({ items: [{ id: "one" }] });
  });

  it("adds pagination metadata alongside displayed items", () => {
    expect(
      withPaginationMetadata(
        {
          items: [{ id: "raw" }],
          has_more: true,
          pagination_key: "next",
        },
        [{ id: "display" }],
      ),
    ).toEqual({
      items: [{ id: "display" }],
      has_more: true,
      pagination_key: "next",
    });
  });
});
