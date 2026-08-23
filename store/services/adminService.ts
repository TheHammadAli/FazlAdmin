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
    getOnlineUsersCount: build.query({
      query: () => ({
        url: `/users/online-count`,
        method: "GET",
      }),
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
    updateUserRole: build.mutation({
      query: ({ id, roles }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: { roles },
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
    updateShop: build.mutation({
      query: ({ id, body }) => ({
        url: `/shops/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_SHOPS"],
    }),
    getShopProducts: build.query({
      query: ({ shopId, page, limit }) => {
        const params = new URLSearchParams({
          page: String(page ?? 1),
          limit: String(limit ?? 10),
        });
        return {
          url: `/products/shop/${shopId}?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_SHOPS"],
    }),
    getShopOrders: build.query({
      query: ({ shopId, page, limit }) => {
        const params = new URLSearchParams({
          ownerModel: "Shop",
          page: String(page ?? 1),
          limit: String(limit ?? 10),
        });
        return {
          url: `/orders/owner/${shopId}?${params.toString()}`,
          method: "GET",
        };
      },
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
    updateService: build.mutation({
      query: ({ id, body }) => ({
        url: `/services/update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_SERVICES"],
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
    updateProduct: build.mutation({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_PRODUCTS", "ADMIN_FEED"],
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
    getUserConversations: build.query({
      query: ({ userId, page, limit }) => {
        const params = new URLSearchParams({
          page: String(page ?? 1),
          limit: String(limit ?? 10),
        });
        return {
          url: `/chat/admin/user/${userId}/conversations?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_USERS"],
    }),
    getConversationMessages: build.query({
      query: ({ conversationId, page, limit }) => {
        const params = new URLSearchParams({
          page: String(page ?? 1),
          limit: String(limit ?? 10),
        });
        return {
          url: `/chat/admin/conversation/${conversationId}/messages?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["ADMIN_USERS"],
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
    getBroadcastDetail: build.query({
      query: (broadcastId: string) => ({
        url: `/broadcast/admin/${broadcastId}`,
        method: "GET",
      }),
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
      query: (body) => ({
        url: `/announcements`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ADMIN_ANNOUNCEMENTS"],
    }),
    updateAnnouncement: build.mutation({
      query: ({ id, body }) => ({
        url: `/announcements/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_ANNOUNCEMENTS"],
    }),
    getSocialLinksForAdmin: build.query({
      query: () => ({
        url: `/settings/social-links`,
        method: "GET",
      }),
      providesTags: ["ADMIN_SETTINGS"],
    }),
    updateSocialLinks: build.mutation({
      query: (body) => ({
        url: `/settings/social-links`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ADMIN_SETTINGS"],
    }),
    getItemReviews: build.query({
      query: ({ itemId, itemType, page = 1, limit = 5 }) => {
        const params = new URLSearchParams({
          itemId,
          itemType,
          page: String(page),
          limit: String(limit),
        });
        return {
          url: `/reviews?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    getItemReviewsAverage: build.query({
      query: ({ itemId, itemType }) => ({
        url: `/reviews/average/${itemType}/${itemId}`,
        method: "GET",
      }),
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

    // ---- Reviews ----
    getAllReviewsForAdmin: build.query({
      query: ({ page, limit, itemType, search }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (itemType) params.set("itemType", itemType);
        if (search?.trim()) params.set("search", search.trim());
        return { url: `/reviews/admin/all?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_REVIEWS"],
    }),

    // ---- Wallet: Dashboard ----
    getWalletDashboardStats: build.query({
      query: (arg) => {
        const { startDate, endDate } = arg ?? {};
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const qs = params.toString();
        return { url: `/wallet/dashboard/stats${qs ? `?${qs}` : ""}`, method: "GET" };
      },
      providesTags: ["ADMIN_WALLET_DASHBOARD"],
    }),

    // ---- Wallet: User wallets ----
    getUserWallets: build.query({
      query: ({ page, limit, search }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search?.trim()) params.set("search", search.trim());
        return { url: `/wallet/users?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_USER_WALLETS"],
    }),
    getUserWalletDetail: build.query({
      query: (userId) => ({ url: `/wallet/users/${userId}`, method: "GET" }),
      providesTags: ["ADMIN_USER_WALLETS"],
    }),
    getUserWalletLedger: build.query({
      query: ({ userId, page, limit }) => ({
        url: `/wallet/users/${userId}/ledger?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_USER_WALLETS"],
    }),
    addUserBalance: build.mutation({
      query: ({ userId, amountMinor, reason }) => ({
        url: `/wallet/users/${userId}/add-balance`,
        method: "POST",
        body: { amountMinor, reason },
      }),
      invalidatesTags: ["ADMIN_USER_WALLETS", "ADMIN_WALLET_TRANSACTIONS", "ADMIN_WALLET_DASHBOARD", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    deductUserBalance: build.mutation({
      query: ({ userId, amountMinor, reason }) => ({
        url: `/wallet/users/${userId}/deduct-balance`,
        method: "POST",
        body: { amountMinor, reason },
      }),
      invalidatesTags: ["ADMIN_USER_WALLETS", "ADMIN_WALLET_TRANSACTIONS", "ADMIN_WALLET_DASHBOARD", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    freezeUserWallet: build.mutation({
      query: ({ userId, reason }) => ({
        url: `/wallet/users/${userId}/freeze`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["ADMIN_USER_WALLETS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    unfreezeUserWallet: build.mutation({
      query: ({ userId }) => ({ url: `/wallet/users/${userId}/unfreeze`, method: "POST" }),
      invalidatesTags: ["ADMIN_USER_WALLETS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    recalculateUserWallet: build.mutation({
      query: ({ userId }) => ({ url: `/wallet/users/${userId}/recalculate`, method: "POST" }),
      invalidatesTags: ["ADMIN_USER_WALLETS", "ADMIN_WALLET_DASHBOARD", "ADMIN_WALLET_AUDIT_LOG"],
    }),

    // ---- Wallet: Merchant wallets ----
    getMerchantWallets: build.query({
      query: ({ page, limit, search }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search?.trim()) params.set("search", search.trim());
        return { url: `/wallet/merchants?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_MERCHANT_WALLETS"],
    }),
    getMerchantWalletDetail: build.query({
      query: (merchantId) => ({ url: `/wallet/merchants/${merchantId}`, method: "GET" }),
      providesTags: ["ADMIN_MERCHANT_WALLETS"],
    }),
    getMerchantWalletLedger: build.query({
      query: ({ merchantId, page, limit }) => ({
        url: `/wallet/merchants/${merchantId}/ledger?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_MERCHANT_WALLETS"],
    }),
    getMerchantWithdrawals: build.query({
      query: ({ merchantId, page, limit }) => ({
        url: `/wallet/merchants/${merchantId}/withdrawals?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["ADMIN_WITHDRAWALS"],
    }),
    addMerchantBalance: build.mutation({
      query: ({ merchantId, amountMinor, reason }) => ({
        url: `/wallet/merchants/${merchantId}/add-balance`,
        method: "POST",
        body: { amountMinor, reason },
      }),
      invalidatesTags: ["ADMIN_MERCHANT_WALLETS", "ADMIN_WALLET_TRANSACTIONS", "ADMIN_WALLET_DASHBOARD", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    deductMerchantBalance: build.mutation({
      query: ({ merchantId, amountMinor, reason }) => ({
        url: `/wallet/merchants/${merchantId}/deduct-balance`,
        method: "POST",
        body: { amountMinor, reason },
      }),
      invalidatesTags: ["ADMIN_MERCHANT_WALLETS", "ADMIN_WALLET_TRANSACTIONS", "ADMIN_WALLET_DASHBOARD", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    freezeMerchantWallet: build.mutation({
      query: ({ merchantId, reason }) => ({
        url: `/wallet/merchants/${merchantId}/freeze`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["ADMIN_MERCHANT_WALLETS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    unfreezeMerchantWallet: build.mutation({
      query: ({ merchantId }) => ({ url: `/wallet/merchants/${merchantId}/unfreeze`, method: "POST" }),
      invalidatesTags: ["ADMIN_MERCHANT_WALLETS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    recalculateMerchantWallet: build.mutation({
      query: ({ merchantId }) => ({ url: `/wallet/merchants/${merchantId}/recalculate`, method: "POST" }),
      invalidatesTags: ["ADMIN_MERCHANT_WALLETS", "ADMIN_WALLET_DASHBOARD", "ADMIN_WALLET_AUDIT_LOG"],
    }),

    // ---- Wallet: Merchant deals ----
    getMerchantDeal: build.query({
      query: (merchantId) => ({ url: `/wallet/merchant-deals/${merchantId}`, method: "GET" }),
      providesTags: ["ADMIN_MERCHANT_DEALS"],
    }),
    updateMerchantDeal: build.mutation({
      query: ({ merchantId, customerDiscountPercent, fazlMarginPercent, reason }) => ({
        url: `/wallet/merchant-deals/${merchantId}`,
        method: "POST",
        body: { customerDiscountPercent, fazlMarginPercent, reason },
      }),
      invalidatesTags: ["ADMIN_MERCHANT_DEALS", "ADMIN_WALLET_AUDIT_LOG"],
    }),

    // ---- Wallet: Transactions ----
    getWalletTransactions: build.query({
      query: ({ page, limit, search, status, paymentMethod, userId, merchantId, startDate, endDate }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search?.trim()) params.set("search", search.trim());
        if (status) params.set("status", status);
        if (paymentMethod) params.set("paymentMethod", paymentMethod);
        if (userId) params.set("userId", userId);
        if (merchantId) params.set("merchantId", merchantId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        return { url: `/wallet/transactions?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_WALLET_TRANSACTIONS"],
    }),
    getWalletTransactionDetail: build.query({
      query: (id) => ({ url: `/wallet/transactions/${id}`, method: "GET" }),
      providesTags: ["ADMIN_WALLET_TRANSACTIONS"],
    }),

    // ---- Wallet: Withdrawals ----
    getWithdrawals: build.query({
      query: ({ page, limit, search, status, merchantId, startDate, endDate }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search?.trim()) params.set("search", search.trim());
        if (status) params.set("status", status);
        if (merchantId) params.set("merchantId", merchantId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        return { url: `/wallet/withdrawals?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_WITHDRAWALS"],
    }),
    getWithdrawalDetail: build.query({
      query: (id) => ({ url: `/wallet/withdrawals/${id}`, method: "GET" }),
      providesTags: ["ADMIN_WITHDRAWALS"],
    }),
    createWithdrawal: build.mutation({
      query: (body) => ({ url: `/wallet/withdrawals`, method: "POST", body }),
      invalidatesTags: ["ADMIN_WITHDRAWALS", "ADMIN_WALLET_AUDIT_LOG", "ADMIN_WALLET_DASHBOARD"],
    }),
    approveWithdrawal: build.mutation({
      query: ({ id }) => ({ url: `/wallet/withdrawals/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["ADMIN_WITHDRAWALS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    rejectWithdrawal: build.mutation({
      query: ({ id, reason }) => ({ url: `/wallet/withdrawals/${id}/reject`, method: "PATCH", body: { reason } }),
      invalidatesTags: ["ADMIN_WITHDRAWALS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    markWithdrawalProcessing: build.mutation({
      query: ({ id }) => ({ url: `/wallet/withdrawals/${id}/processing`, method: "PATCH" }),
      invalidatesTags: ["ADMIN_WITHDRAWALS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    completeWithdrawal: build.mutation({
      query: ({ id, externalFeeAmountMinor, externalFeeNote }) => ({
        url: `/wallet/withdrawals/${id}/complete`,
        method: "PATCH",
        body: { externalFeeAmountMinor, externalFeeNote },
      }),
      invalidatesTags: [
        "ADMIN_WITHDRAWALS",
        "ADMIN_MERCHANT_WALLETS",
        "ADMIN_WALLET_TRANSACTIONS",
        "ADMIN_WALLET_DASHBOARD",
        "ADMIN_WALLET_AUDIT_LOG",
      ],
    }),
    cancelWithdrawal: build.mutation({
      query: ({ id, reason }) => ({ url: `/wallet/withdrawals/${id}/cancel`, method: "PATCH", body: { reason } }),
      invalidatesTags: ["ADMIN_WITHDRAWALS", "ADMIN_WALLET_AUDIT_LOG"],
    }),

    // ---- Wallet: Refunds ----
    getRefunds: build.query({
      query: ({ page, limit, search, refundStatus, customerId, merchantId, startDate, endDate }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search?.trim()) params.set("search", search.trim());
        if (refundStatus) params.set("refundStatus", refundStatus);
        if (customerId) params.set("customerId", customerId);
        if (merchantId) params.set("merchantId", merchantId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        return { url: `/wallet/refunds?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_REFUNDS"],
    }),
    getRefundDetail: build.query({
      query: (id) => ({ url: `/wallet/refunds/${id}`, method: "GET" }),
      providesTags: ["ADMIN_REFUNDS"],
    }),
    createRefund: build.mutation({
      query: (body) => ({ url: `/wallet/refunds`, method: "POST", body }),
      invalidatesTags: ["ADMIN_REFUNDS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
    completeRefund: build.mutation({
      query: ({ id }) => ({ url: `/wallet/refunds/${id}/complete`, method: "PATCH" }),
      invalidatesTags: [
        "ADMIN_REFUNDS",
        "ADMIN_USER_WALLETS",
        "ADMIN_WALLET_TRANSACTIONS",
        "ADMIN_WALLET_DASHBOARD",
        "ADMIN_WALLET_AUDIT_LOG",
      ],
    }),
    rejectRefund: build.mutation({
      query: ({ id, reason }) => ({ url: `/wallet/refunds/${id}/reject`, method: "PATCH", body: { reason } }),
      invalidatesTags: ["ADMIN_REFUNDS", "ADMIN_WALLET_AUDIT_LOG"],
    }),

    // ---- Wallet: Audit log ----
    getWalletAuditLog: build.query({
      query: ({ page, limit, adminId, action, targetType, subjectUserId, startDate, endDate }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (adminId) params.set("adminId", adminId);
        if (action) params.set("action", action);
        if (targetType) params.set("targetType", targetType);
        if (subjectUserId) params.set("subjectUserId", subjectUserId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        return { url: `/wallet/audit-log?${params.toString()}`, method: "GET" };
      },
      providesTags: ["ADMIN_WALLET_AUDIT_LOG"],
    }),

    // ---- Wallet: Settings ----
    getWalletSettings: build.query({
      query: () => ({ url: `/wallet/settings`, method: "GET" }),
      providesTags: ["ADMIN_WALLET_SETTINGS"],
    }),
    updateWalletSettings: build.mutation({
      query: (body) => ({ url: `/wallet/settings`, method: "PUT", body }),
      invalidatesTags: ["ADMIN_WALLET_SETTINGS", "ADMIN_WALLET_AUDIT_LOG"],
    }),
  }),
});
export const {
  useGetAllCategoriesForAdminQuery,
  useGetAllUsersFromAdminQuery,
  useGetOnlineUsersCountQuery,
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
  useGetShopProductsQuery,
  useGetShopOrdersQuery,
  useUpdateShopMutation,
  useGetAllServicesForAdminQuery,
  useGetServiceDetailQuery,
  useUpdateServiceMutation,
  useGetAllProductsForAdminQuery,
  useLazyGetAllProductsForAdminQuery,
  useGetProductDetailQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useActivateUserMutation,
  useUpdateUserRoleMutation,
  useCreateNewCategoryMutation,
  useUpdateCategoryMutation,
  useTranslateTextMutation,
  useGetAllServiceRequestsForAdminQuery,
  useLazyGetAllServiceRequestsForAdminQuery,
  useGetServiceRequestDetailQuery,
  useGetServiceRequestStatsQuery,
  useGetBookingConversationQuery,
  useGetUserConversationsQuery,
  useGetConversationMessagesQuery,
  useGetAllBroadcastsForAdminQuery,
  useGetBroadcastDetailQuery,
  useGetBroadcastRecipientsQuery,
  useGetBroadcastThreadMessagesQuery,
  useCloseBroadcastMutation,
  useDeleteBroadcastMutation,
  useGetAllAnnouncementsForAdminQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useGetSocialLinksForAdminQuery,
  useUpdateSocialLinksMutation,
  useGetItemReviewsQuery,
  useGetItemReviewsAverageQuery,
  useGetAllAdminAccountsQuery,
  useCreateAdminAccountMutation,
  useUpdateAdminAccountMutation,
  useDisableAdminAccountMutation,
  useEnableAdminAccountMutation,
  useResetAdminPasswordMutation,
  useDisableShopMutation,
  useEnableShopMutation,
  useGetAllActivityLogsQuery,
  useGetAllReviewsForAdminQuery,
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
  useGetWalletDashboardStatsQuery,
  useGetUserWalletsQuery,
  useGetUserWalletDetailQuery,
  useGetUserWalletLedgerQuery,
  useAddUserBalanceMutation,
  useDeductUserBalanceMutation,
  useFreezeUserWalletMutation,
  useUnfreezeUserWalletMutation,
  useRecalculateUserWalletMutation,
  useGetMerchantWalletsQuery,
  useGetMerchantWalletDetailQuery,
  useGetMerchantWalletLedgerQuery,
  useGetMerchantWithdrawalsQuery,
  useAddMerchantBalanceMutation,
  useDeductMerchantBalanceMutation,
  useFreezeMerchantWalletMutation,
  useUnfreezeMerchantWalletMutation,
  useRecalculateMerchantWalletMutation,
  useGetMerchantDealQuery,
  useUpdateMerchantDealMutation,
  useGetWalletTransactionsQuery,
  useGetWalletTransactionDetailQuery,
  useGetWithdrawalsQuery,
  useGetWithdrawalDetailQuery,
  useCreateWithdrawalMutation,
  useApproveWithdrawalMutation,
  useRejectWithdrawalMutation,
  useMarkWithdrawalProcessingMutation,
  useCompleteWithdrawalMutation,
  useCancelWithdrawalMutation,
  useGetRefundsQuery,
  useGetRefundDetailQuery,
  useCreateRefundMutation,
  useCompleteRefundMutation,
  useRejectRefundMutation,
  useGetWalletAuditLogQuery,
  useGetWalletSettingsQuery,
  useUpdateWalletSettingsMutation,
} = adminService;
