import { getCookie } from "cookies-next";

/** Client/server cookie check — not safe for Edge middleware. */
export function isGuestSession(): boolean {
  return getCookie("isGuest") === "true";
}
