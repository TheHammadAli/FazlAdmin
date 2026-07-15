import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { i18n } from "@/i18n.config";
import {
  isGuestAllowedPathname,
  isGuestRestrictedPathname,
} from "@/utils/guestAccess";

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
  const isGuest = request.cookies.get("isGuest")?.value === "true";
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
    const isAdmin = request.cookies.get("isAdmin")?.value === "true";

    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }

    return NextResponse.next();
  }

  const publicRoutes: string[] = [`/${locale}/google/auth/success`];

  const authRoutes: string[] = [
    `/${locale}/send-otp`,
    `/${locale}/signin`,
    `/${locale}/signup`,
    `/${locale}/verify-otp`,
    `/${locale}/signup-instructor`,
    `/${locale}/forget-password`,
    `/${locale}/verify-email`,
    `/${locale}/reset-password`,
    `/${locale}/set-password`,
  ];
  const publicInfoRoutes: string[] = [
    `/${locale}/contact-us`,
    `/${locale}/terms-conditions`,
    `/${locale}/privacy-policy`,
  ];

  function checkPathStartsWith(path: string) {
    return authRoutes.some((p: string) => path.startsWith(p));
  }
  function isPublicInfoRoute(path: string) {
    return publicInfoRoutes.some((p: string) => path.startsWith(p));
  }

  if (pathnameIsMissingLocale) {
    pathname = `/${locale}${
      pathname.startsWith("/") ? "" : "/"
    }${pathname}${urlParams}`;
    return NextResponse.redirect(new URL(pathname, request.url));
  }
  if (
    publicRoutes.some((p: string) => {
      return pathname.startsWith(p);
    })
  ) {
    return NextResponse.next();
  }

  if (
    (token || isGuest) &&
    (pathname === "/" || pathname === `/${locale}`)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  if (isGuest && !token && pathname.startsWith(`/${locale}/complete-info`)) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  if (
    isGuest &&
    !token &&
    isGuestRestrictedPathname(pathname) &&
    !isGuestAllowedPathname(pathname)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  if (token && checkPathStartsWith(pathname)) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (token && !completeProfile) {
    if (pathname !== `/${locale}/complete-info`) {
      return NextResponse.redirect(
        new URL(`/${locale}/complete-info`, request.url),
      );
    }
  }
  if (token && completeProfile && pathname === `/${locale}/complete-info`) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  if (
    !token &&
    !isGuest &&
    !checkPathStartsWith(pathname) &&
    !isPublicInfoRoute(pathname)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|notifications/).*)"],
};
