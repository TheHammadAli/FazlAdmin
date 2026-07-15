import { baseApi } from "../baseApi";
export const notificationService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllNotifications: build.query({
      query: ({
        id,
        page,
        limit,
      }: {
        id: string;
        page: number;
        limit: number;
      }) => {
        return {
          url: `/notifications/${id}?page=${page}&limit=${limit}`,
          method: "GET",
        };
      },
      providesTags: ["NOTIFICATIONS"],
    }),
    getUnreadNotificationsCount: build.query({
      query: (id) => {
        return {
          url: `/notifications/${id}/unread-count`,
          method: "GET",
        };
      },
      providesTags: ["NOTIFICATIONS"],
    }),
    markAsRead: build.mutation({
      query: ({ id }: { id: string }) => {
        return {
          url: `/notifications/${id}/read`,
          method: "PATCH",
        };
      },
      invalidatesTags: ["NOTIFICATIONS"],
    }),
  }),
});
export const {
  useMarkAsReadMutation,
  useGetAllNotificationsQuery,
  useGetUnreadNotificationsCountQuery,
} = notificationService;
