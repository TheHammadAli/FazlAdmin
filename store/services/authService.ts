import { baseApi } from "../baseApi";

export const authService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendOtp: build.mutation({
      query: (body) => ({
        url: "/auth/send-otp",
        method: "POST",
        body,
      }),
    }),
    signin: build.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    forgotPassword: build.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: build.mutation({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "PUT",
        body,
      }),
    }),
    logoutAdmin: build.mutation({
      query: (body: { token: string }) => ({
        url: "/auth/logout",
        method: "POST",
        body,
      }),
    }),
    getLocations: build.query({
      query: (params) => {
        return {
          url: `/search/autocomplete-locations?${new URLSearchParams(params)}`,
          method: "GET",
        };
      },
    }),
    deleteAccount: build.mutation({
      query: ({ id }) => ({
        url: `/users/${id}/deactivate`,
        method: "DELETE",
      }),
      invalidatesTags: ["ADMIN_USERS"],
    }),
  }),
});
export const {
  useDeleteAccountMutation,
  useGetLocationsQuery,
  useResetPasswordMutation,
  useForgotPasswordMutation,
  useSendOtpMutation,
  useSigninMutation,
  useLogoutAdminMutation,
} = authService;
