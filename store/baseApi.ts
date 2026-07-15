import {
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/assets/content/constants";

import { getRefreshToken, getToken } from "@/utils/getToken";
import { extractAuthTokens } from "@/utils/authCookies";
import { logout, setToken } from "./reducers/authReducer";
import { getCookie } from "cookies-next";
import { isGuestSession } from "@/utils/isGuestSession";
import { i18n } from "@/i18n.config";

/** Login/signup failures must not trigger refresh/logout redirects. */
const PUBLIC_AUTH_ENDPOINTS = new Set([
  "sendOtp",
  "verifyOtp",
  "verifyEmail",
  "signup",
  "signin",
  "forgotPassword",
  "resetPassword",
]);

const resolveLanguage = () => {
  if (typeof window !== "undefined") {
    const firstSegment = window.location.pathname.split("/")[1];
    if (i18n.locales.includes(firstSegment as (typeof i18n.locales)[number])) {
      return firstSegment;
    }
  }
  return getCookie("lang")?.toString() || i18n.defaultLocale;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { endpoint }) => {
    const lang = resolveLanguage();
    headers.set("accept-language", lang);
    const token = getToken();
    const excludeToken = [...PUBLIC_AUTH_ENDPOINTS, "getLocations"];

    if (token && !excludeToken.includes(endpoint)) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

/** Refresh must not send the expired access token in Authorization. */
const refreshBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    headers.set("accept-language", resolveLanguage());
    return headers;
  },
});

const redirectToSignIn = () => {
  const locale = resolveLanguage();
  window.location.href = `/${locale}/signin`;
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions: object) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Wrong password / public auth errors: return to the form, do not redirect.
    if (PUBLIC_AUTH_ENDPOINTS.has(api.endpoint)) {
      return result;
    }
    // Guests have no token; do not clear guest session on public API 401s.
    if (isGuestSession()) {
      return result;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken || refreshToken === "" || refreshToken === "undefined") {
      api.dispatch(logout());
      redirectToSignIn();
      return result;
    }

    const refreshResult = await refreshBaseQuery(
      {
        url: "/auth/refreshToken",
        method: "POST",
        body: {
          token: refreshToken,
        },
      },
      api,
      extraOptions,
    );

    const tokens = refreshResult.data
      ? extractAuthTokens(refreshResult.data)
      : null;

    if (tokens) {
      api.dispatch(
        setToken({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      );
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
      redirectToSignIn();
    }
  }
  return result;
};
export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "profile",
    "PRODUCT",
    "NOTIFICATIONS",
    "SHOP_DETAIL",
    "SERVICES",
    "SERVICES_REQUESTS",
    "Chat",
    "REVIEW",
    "BROADCAST",
    "ORDERS",
    "CATEGORIES",
    "ADMIN_USERS",
    "ADMIN_CATEGORIES",
  ],
  endpoints: () => ({}),
});

export default baseApi;
