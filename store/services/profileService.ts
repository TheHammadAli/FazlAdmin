import { baseApi } from "../baseApi";
export const profileService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateProfile: build.mutation({
      query: ({ formData, id }) => ({
        url: "/users/" + id,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["profile"],
    }),
  }),
});
export const { useUpdateProfileMutation } = profileService;
