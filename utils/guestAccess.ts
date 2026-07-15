/** Nav hrefs hidden and blocked for guest users (no auth token). */
export const GUEST_RESTRICTED_HREFS = [
  "/services",
  "/selling",
  "/chat",
  "/updates",
] as const;

/** Locale-prefixed path prefixes blocked in middleware for guests. */
export const GUEST_RESTRICTED_PATH_SEGMENTS = [
  "/selling",
  "/services",
  "/chat",
  "/profile",
] as const;

export function isGuestRestrictedHref(href: string): boolean {
  return (GUEST_RESTRICTED_HREFS as readonly string[]).includes(href);
}

export function isGuestRestrictedPathname(pathname: string): boolean {
  return GUEST_RESTRICTED_PATH_SEGMENTS.some((segment) =>
    pathname.includes(segment),
  );
}

export function getLinksForGuest<T extends { href: string }>(links: T[]): T[] {
  return links.filter((link) => !isGuestRestrictedHref(link.href));
}

/** Dashboard pages guests may open (browse-only). */
export const GUEST_ALLOWED_PATH_SEGMENTS = [
  "/book-service",
  "/buy-product",
] as const;

export function isGuestAllowedPathname(pathname: string): boolean {
  return GUEST_ALLOWED_PATH_SEGMENTS.some((segment) =>
    pathname.includes(segment),
  );
}
