import { baseApi } from "../baseApi";

/**
 * The signed-in staff member's own profile.
 *
 * These used to be /users/:id. Staff moved out of that table into `admins` /
 * `members`, so the id in the URL no longer resolved — the endpoints are keyed
 * on the JWT principal instead, which is why no id is sent.
 */
export const profileService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOwnProfile: build.query({
      query: () => ({
        url: "/admins/me",
        method: "GET",
      }),
      providesTags: ["profile"],
    }),
    updateProfile: build.mutation({
      query: (body: { phone?: string; address?: string }) => ({
        url: "/admins/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["profile"],
    }),
    deactivateOwnAccount: build.mutation({
      query: () => ({
        url: "/admins/me",
        method: "DELETE",
      }),
      invalidatesTags: ["profile"],
    }),
  }),
});

export const {
  useGetOwnProfileQuery,
  useUpdateProfileMutation,
  useDeactivateOwnAccountMutation,
} = profileService;
