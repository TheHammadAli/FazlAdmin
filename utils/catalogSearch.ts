/** Normalize `/search/all-products` and `/search/all-services` list payloads. */
export function getCatalogItemsFromSearchResponse(
  response: { data?: unknown } | null | undefined,
): unknown[] {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown[] }).items)
  ) {
    return (data as { items: unknown[] }).items;
  }
  return [];
}
