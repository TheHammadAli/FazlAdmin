import { baseApi } from "../baseApi";

// Define or import these interfaces from the correct location

export const authService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendOtp: build.mutation({
      query: (body) => ({
        url: "/auth/send-otp",
        method: "POST",
        body,
      }),
    }),
    verifyOtp: build.mutation({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
    }),
    // this is for resed
    verifyEmail: build.mutation({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
    }),
    signup: build.mutation({
      query: (body) => ({
        url: "/users/createUser",
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
    getLocations: build.query({
      query: (params) => {
        return {
          url: `/search/autocomplete-locations?${new URLSearchParams(params)}`,
          method: "GET",
        };
      },
    }),
    getUserWithProvidedToken: build.query({
      query: ({ token }) => {
        return {
          url: `/auth/getCurrentUser`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      },
    }),
    getProductOwnerDetail: build.query({
      query: (id) => {
        return {
          url: `/users/detail/${id}`,
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
  useGetProductOwnerDetailQuery,
  useGetUserWithProvidedTokenQuery,
  useGetLocationsQuery,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSignupMutation,
  useSigninMutation,
} = authService;
