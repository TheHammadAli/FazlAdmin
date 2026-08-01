import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "@/i18n.config";

function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

function getLocalizedAdminPath(pathname: string) {
  const match = pathname.match(/^\/(en|ur)(\/admin(?:\/.*)?)$/);
  return match ? match[2] : null;
}

/**
 * Next.js 16+: `proxy.ts` replaces deprecated `middleware.ts`.
 * Runs on Node.js (not Edge), so local @/ imports are safe on Vercel.
 */
export function proxy(request: NextRequest) {
  const {
    nextUrl: { search },
  } = request;
  const urlSearchParams = new URLSearchParams(search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const token = request.cookies.get("token")?.value || "";
  const isAdmin = request.cookies.get("isAdmin")?.value === "true";
  const completeProfile =
    request.cookies.get("profileCompleted")?.value === "true";
  const urlParams = "?" + new URLSearchParams(params);
  let pathname = request.nextUrl.pathname;
  const locale = request.cookies.get("lang")?.value || "en";
  const pathnameIsMissingLocale = i18n.locales.every(
    (loc) => !pathname.startsWith(`/${loc}/`) && pathname !== `/${loc}`,
  );

  const localizedAdminPath = getLocalizedAdminPath(pathname);
  if (localizedAdminPath) {
    return NextResponse.redirect(
      new URL(`${localizedAdminPath}${search}`, request.url),
    );
  }

  if (isAdminPath(pathname)) {
    if (!token || !isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
    }

    // Prevent the browser's back/forward cache from restoring this page after logout —
    // without this, hitting "back" could flash the previous admin page before any
    // client-side check catches up, since bfcache restores skip this middleware entirely.
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  const authRoutes: string[] = [
    `/${locale}/signin`,
    `/${locale}/forget-password`,
    `/${locale}/reset-password`,
  ];

  function checkPathStartsWith(path: string) {
    return authRoutes.some((p: string) => path.startsWith(p));
  }

  if (pathnameIsMissingLocale) {
    pathname = `/${locale}${
      pathname.startsWith("/") ? "" : "/"
    }${pathname}${urlParams}`;
    return NextResponse.redirect(new URL(pathname, request.url));
  }

  if (token && isAdmin && (pathname === "/" || pathname === `/${locale}`)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (token && isAdmin && checkPathStartsWith(pathname)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (token && !completeProfile) {
    if (pathname !== `/${locale}/complete-info`) {
      return NextResponse.redirect(
        new URL(`/${locale}/complete-info`, request.url),
      );
    }
  }

  if (token && completeProfile && pathname === `/${locale}/complete-info`) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!token && !checkPathStartsWith(pathname)) {
    return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|notifications/).*)"],
};
