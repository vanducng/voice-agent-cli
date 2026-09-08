export interface PaginatedResponse<T> {
  has_more?: boolean;
  items?: T[] | null;
  pagination_key?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  has_more?: boolean;
  pagination_key?: string;
}

export function getPaginatedItems<T>(
  response: PaginatedResponse<T>,
  errorMessage = "Unexpected Retell list response: expected the current paginated items[] contract.",
): T[] {
  if (!response || !Array.isArray(response.items)) {
    throw new Error(errorMessage);
  }
  return response.items;
}

export function withPaginationMetadata<T>(
  response: PaginatedResponse<unknown>,
  items: T[],
): PaginatedResult<T> {
  const output: PaginatedResult<T> = { items };

  if (response.has_more !== undefined) {
    output.has_more = response.has_more;
  }
  if (response.pagination_key !== undefined) {
    output.pagination_key = response.pagination_key;
  }
  return output;
}

export function getPaginatedResult<T>(
  response: PaginatedResponse<T>,
): PaginatedResult<T> {
  const items = getPaginatedItems(response);
  return withPaginationMetadata(response, items);
}

export async function collectPaginatedItems<T>(
  loadPage: (paginationKey?: string) => Promise<PaginatedResponse<T>>,
  errorMessage?: string,
): Promise<T[]> {
  const items: T[] = [];
  let paginationKey: string | undefined;

  for (;;) {
    const response = await loadPage(paginationKey);
    items.push(...getPaginatedItems(response, errorMessage));
    if (!response.has_more) {
      return items;
    }
    if (!response.pagination_key || response.pagination_key === paginationKey) {
      throw new Error(
        "Unexpected Retell list response: has_more is true without a new pagination_key.",
      );
    }
    paginationKey = response.pagination_key;
  }
}
