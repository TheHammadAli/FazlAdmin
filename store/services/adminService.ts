import { baseApi } from "../baseApi";
export const adminService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllUsersFromAdmin: build.query({
      query: ({ page, limit, search, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/users/allUsers?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_USERS"],
    }),
    getUserDetail: build.query({
      query: (id: string) => ({
        url: `/users/detail/${id}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_USERS"],
    }),
    getUserStats: build.query({
      query: (id: string) => ({
        url: `/users/${id}/stats`,
        method: "GET",
      }),
      providesTags: ["ADMIN_USERS"],
    }),
    getUserShops: build.query({
      query: ({ userId, page, limit }: { userId: string; page: number; limit: number }) => ({
        url: `/shops/admin/user/${userId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_SHOPS"],
    }),
    getUserListings: build.query({
      query: ({ userId, page, limit }: { userId: string; page: number; limit: number }) => ({
        url: `/products/admin/user/${userId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_PRODUCTS"],
    }),
    getUserServices: build.query({
      query: ({ userId, page, limit }: { userId: string; page: number; limit: number }) => ({
        url: `/services/admin/user/${userId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_SERVICES"],
    }),
    getUserBookings: build.query({
      query: ({ userId, page, limit }: { userId: string; page: number; limit: number }) => ({
        url: `/services/admin/user/${userId}/bookings?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_BOOKINGS"],
    }),
    activateUser: build.mutation({
      query: ({ id }) => ({
        url: `/users/${id}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: ["ADMIN_USERS"],
    }),
    getAllShopsFromAdmin: build.query({
      query: ({ page, limit, search, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/shops/allShops?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_SHOPS"],
    }),
    getShopDetail: build.query({
      query: (id: string) => ({
        url: `/shops/detail/${id}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_SHOPS"],
    }),
    getAllServicesForAdmin: build.query({
      query: ({ page, limit, search, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("name", search.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/search/all-services?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_SERVICES"],
    }),
    getServiceDetail: build.query({
      query: (id: string) => ({
        url: `/services/${id}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_SERVICES"],
    }),
    getAllProductsForAdmin: build.query({
      query: ({ page, limit, search, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("name", search.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/search/all-products?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_PRODUCTS"],
    }),
    getProductDetail: build.query({
      query: (id: string) => ({
        url: `/products/detail/${id}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_PRODUCTS"],
    }),
    deleteProduct: build.mutation({
      query: (id: string) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ADMIN_PRODUCTS", "ADMIN_FEED"],
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
    translateText: build.mutation({
      query: (text: string) => ({
        url: `/categories/translate`,
        method: "POST",
        body: { text },
      }),
    }),
    getAllCategoriesForAdmin: build.query({
      query: (args?: { startDate?: string; endDate?: string }) => {
        const params = new URLSearchParams();
        if (args?.startDate) {
          params.set("startDate", args.startDate);
        }
        if (args?.endDate) {
          params.set("endDate", args.endDate);
        }
        const queryString = params.toString();
        return {
          url: `/categories/admin${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CATEGORIES", "ADMIN_CATEGORIES"],
    }),
    getAllServiceRequestsForAdmin: build.query({
      query: ({ page, limit, search, bookingStatus, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (bookingStatus?.trim()) {
          params.set("bookingStatus", bookingStatus.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/services/bookings/all?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_BOOKINGS"],
    }),
    getServiceRequestDetail: build.query({
      query: (requestId: string) => ({
        url: `/services/requests/detail/${requestId}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_BOOKINGS"],
    }),
    getBookingConversation: build.query({
      query: ({ customerId, providerId, page, limit }) => {
        const params = new URLSearchParams({
          customerId,
          providerId,
          page: String(page ?? 1),
          limit: String(limit ?? 10),
        });
        return {
          url: `/chat/admin/conversation?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_BOOKINGS"],
    }),
    getServiceRequestStats: build.query({
      query: (args?: { startDate?: string; endDate?: string }) => {
        const params = new URLSearchParams();
        if (args?.startDate) {
          params.set("startDate", args.startDate);
        }
        if (args?.endDate) {
          params.set("endDate", args.endDate);
        }
        const queryString = params.toString();
        return {
          url: `/services/bookings/stats${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_BOOKINGS"],
    }),
    getAllBroadcastsForAdmin: build.query({
      query: ({ page, limit, search, status, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (status?.trim()) {
          params.set("status", status.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/broadcast/admin/all?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_BROADCASTS"],
    }),
    getBroadcastRecipients: build.query({
      query: (broadcastId: string) => ({
        url: `/broadcast/admin/${broadcastId}/recipients`,
        method: "GET",
      }),
      providesTags: ["ADMIN_BROADCASTS"],
    }),
    getBroadcastThreadMessages: build.query({
      query: ({ broadcastId, sellerId, page, limit }) => {
        const params = new URLSearchParams({
          page: String(page ?? 1),
          limit: String(limit ?? 10),
        });
        return {
          url: `/broadcast/admin/${broadcastId}/recipients/${sellerId}/messages?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_BROADCASTS"],
    }),
    closeBroadcast: build.mutation({
      query: (broadcastId: string) => ({
        url: `/broadcast/admin/${broadcastId}/close`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_BROADCASTS"],
    }),
    deleteBroadcast: build.mutation({
      query: (broadcastId: string) => ({
        url: `/broadcast/admin/${broadcastId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ADMIN_BROADCASTS"],
    }),
    getAllAnnouncementsForAdmin: build.query({
      query: ({ page, limit }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        return {
          url: `/announcements?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_ANNOUNCEMENTS"],
    }),
    createAnnouncement: build.mutation({
      query: (body: { title: string; message: string }) => ({
        url: `/announcements`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ADMIN_ANNOUNCEMENTS"],
    }),
    getAllAdminAccounts: build.query({
      query: ({ page, limit, search }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        return {
          url: `/users/admins?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_ACCOUNTS"],
    }),
    createAdminAccount: build.mutation({
      query: (body: {
        name: string;
        email: string;
        role: string;
        permissions?: { page: string; actions: string[] }[];
      }) => ({
        url: `/users/admins`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ADMIN_ACCOUNTS"],
    }),
    updateAdminAccount: build.mutation({
      query: ({ id, body }) => ({
        url: `/users/admins/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ADMIN_ACCOUNTS"],
    }),
    disableAdminAccount: build.mutation({
      query: (id: string) => ({
        url: `/users/admins/${id}/disable`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_ACCOUNTS"],
    }),
    enableAdminAccount: build.mutation({
      query: (id: string) => ({
        url: `/users/admins/${id}/enable`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_ACCOUNTS"],
    }),
    resetAdminPassword: build.mutation({
      query: ({ id, body }: { id: string; body: { newPassword?: string } }) => ({
        url: `/users/admins/${id}/reset-password`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ADMIN_ACCOUNTS"],
    }),
    disableShop: build.mutation({
      query: (id: string) => ({
        url: `/shops/${id}/disable`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_SHOPS"],
    }),
    enableShop: build.mutation({
      query: (id: string) => ({
        url: `/shops/${id}/enable`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_SHOPS"],
    }),
    getFeedVideos: build.query({
      query: ({ page, limit, search, startDate, endDate }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        return {
          url: `/products/admin/with-videos?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_FEED"],
    }),
    suspendFeedVideo: build.mutation({
      query: (id: string) => ({
        url: `/products/${id}/disable`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_FEED"],
    }),
    enableFeedVideo: build.mutation({
      query: (id: string) => ({
        url: `/products/${id}/enable`,
        method: "PATCH",
      }),
      invalidatesTags: ["ADMIN_FEED"],
    }),
    getAllMembers: build.query({
      query: () => ({
        url: `/users/members`,
        method: "GET",
      }),
      providesTags: ["ADMIN_MEMBERS"],
    }),
    createMember: build.mutation({
      query: (body: { name: string; email: string }) => ({
        url: `/users/members`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ADMIN_MEMBERS"],
    }),
    updateMember: build.mutation({
      query: ({ id, body }: { id: string; body: { name?: string; email?: string } }) => ({
        url: `/users/members/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ADMIN_MEMBERS"],
    }),
    deleteMember: build.mutation({
      query: (id: string) => ({
        url: `/users/members/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ADMIN_MEMBERS", "ADMIN_TASKS"],
    }),
    resetMemberPassword: build.mutation({
      query: ({ id, body }: { id: string; body: { newPassword?: string } }) => ({
        url: `/users/members/${id}/reset-password`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ADMIN_MEMBERS"],
    }),
    getAllTasks: build.query({
      query: ({ page, limit, search, status }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (status?.trim()) {
          params.set("status", status.trim());
        }
        return {
          url: `/tasks?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_TASKS"],
    }),
    createTask: build.mutation({
      query: (body: {
        title: string;
        description?: string;
        assignees: string[];
        priority?: string;
        dueDate?: string;
      }) => ({
        url: `/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ADMIN_TASKS"],
    }),
    updateTask: build.mutation({
      query: ({ id, body }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_TASKS"],
    }),
    deleteTask: build.mutation({
      query: (id: string) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ADMIN_TASKS"],
    }),
    getAllActivityLogs: build.query({
      query: ({ page, limit, search, action, role, actorId }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        if (action?.trim()) {
          params.set("action", action.trim());
        }
        if (role?.trim()) {
          params.set("role", role.trim());
        }
        if (actorId?.trim()) {
          params.set("actorId", actorId.trim());
        }
        return {
          url: `/activity-logs?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_ACTIVITY_LOGS"],
    }),
  }),
});
export const {
  useGetAllCategoriesForAdminQuery,
  useGetAllUsersFromAdminQuery,
  useLazyGetAllUsersFromAdminQuery,
  useGetUserDetailQuery,
  useGetUserStatsQuery,
  useGetUserShopsQuery,
  useGetUserListingsQuery,
  useGetUserServicesQuery,
  useGetUserBookingsQuery,
  useGetAllShopsFromAdminQuery,
  useLazyGetAllShopsFromAdminQuery,
  useGetShopDetailQuery,
  useGetAllServicesForAdminQuery,
  useGetServiceDetailQuery,
  useGetAllProductsForAdminQuery,
  useLazyGetAllProductsForAdminQuery,
  useGetProductDetailQuery,
  useDeleteProductMutation,
  useActivateUserMutation,
  useCreateNewCategoryMutation,
  useUpdateCategoryMutation,
  useTranslateTextMutation,
  useGetAllServiceRequestsForAdminQuery,
  useLazyGetAllServiceRequestsForAdminQuery,
  useGetServiceRequestDetailQuery,
  useGetServiceRequestStatsQuery,
  useGetBookingConversationQuery,
  useGetAllBroadcastsForAdminQuery,
  useGetBroadcastRecipientsQuery,
  useGetBroadcastThreadMessagesQuery,
  useCloseBroadcastMutation,
  useDeleteBroadcastMutation,
  useGetAllAnnouncementsForAdminQuery,
  useCreateAnnouncementMutation,
  useGetAllAdminAccountsQuery,
  useCreateAdminAccountMutation,
  useUpdateAdminAccountMutation,
  useDisableAdminAccountMutation,
  useEnableAdminAccountMutation,
  useResetAdminPasswordMutation,
  useDisableShopMutation,
  useEnableShopMutation,
  useGetAllActivityLogsQuery,
  useGetFeedVideosQuery,
  useSuspendFeedVideoMutation,
  useEnableFeedVideoMutation,
  useGetAllMembersQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
  useResetMemberPasswordMutation,
  useGetAllTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = adminService;
