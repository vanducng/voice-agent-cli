import { describe, expect, it, vi } from "vitest";
import {
  collectPaginatedItems,
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

describe("collectPaginatedItems", () => {
  it("walks pages until has_more is false", async () => {
    const loadPage = vi.fn(async (paginationKey?: string) => {
      if (paginationKey === undefined) {
        return {
          items: [{ id: "one" }],
          has_more: true,
          pagination_key: "page-2",
        };
      }
      return {
        items: [{ id: "two" }],
        has_more: false,
      };
    });

    await expect(collectPaginatedItems(loadPage)).resolves.toEqual([
      { id: "one" },
      { id: "two" },
    ]);
    expect(loadPage).toHaveBeenNthCalledWith(1, undefined);
    expect(loadPage).toHaveBeenNthCalledWith(2, "page-2");
  });

  it("rejects a page that claims more results without a new key", async () => {
    await expect(
      collectPaginatedItems(async () => ({
        items: [{ id: "one" }],
        has_more: true,
      })),
    ).rejects.toThrow("has_more is true without a new pagination_key");
  });
});
