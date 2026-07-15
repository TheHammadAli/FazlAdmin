import { baseApi } from "../baseApi";
export const adminService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllUsersFromAdmin: build.query({
      query: ({ page, limit }) => ({
        url: `/users/allUsers?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_USERS"],
    }),
    activateUser: build.mutation({
      query: ({ id }) => ({
        url: `/users/${id}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: ["ADMIN_USERS"],
    }),
    createNewCategory: build.mutation({
      query: (body) => ({
        url: `/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ADMIN_CATEGORIES", "CATEGORIES"],
    }),
    updateCategory: build.mutation({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_CATEGORIES", "CATEGORIES"],
    }),
    getAllCategoriesForAdmin: build.query({
      query: () => {
        return {
          url: `/categories/admin`,
          method: "GET",
        };
      },
      providesTags: ["CATEGORIES", "ADMIN_CATEGORIES"],
    }),
  }),
});
export const {
  useGetAllCategoriesForAdminQuery,
  useGetAllUsersFromAdminQuery,
  useActivateUserMutation,
  useCreateNewCategoryMutation,
  useUpdateCategoryMutation,
} = adminService;
