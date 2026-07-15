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

    getUserDetail: build.query({
      query: (id) => {
        return {
          url: `/users/detail/${id}`,
          method: "GET",
        };
      },
      providesTags: ["profile"],
    }),
  }),
});
export const {
  useGetUserDetailQuery,
  useUpdateProfileMutation,
  useLazyGetUserDetailQuery,
} = profileService;
