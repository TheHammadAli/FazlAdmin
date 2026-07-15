import { baseApi } from "../baseApi";
export const feedService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllProductsFeed: build.query({
      query: ({ page, limit }: { page: number; limit: number }) => {
        return {
          url: `/products/with-videos/all?page=${page}&limit=${limit}`,
          method: "GET",
        };
      },
    }),
    getAllServicesFeed: build.query({
      query: ({ page, limit }: { page: number; limit: number }) => {
        return {
          url: `/services/with-videos/all?page=${page}&limit=${limit}`,
          method: "GET",
        };
      },
    }),
    likeVideo: build.mutation({
      query: (body: any) => {
        return {
          url: `/likes`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["PRODUCT"],
    }),
    unlikeVideo: build.mutation({
      query: (body: any) => {
        return {
          url: `/likes`,
          method: "DELETE",
          body,
        };
      },
      invalidatesTags: ["PRODUCT"],
    }),
    likedVideoByUser: build.query({
      query: ({ userId, type }: any) => {
        return {
          url: `/likes/user/${userId}?itemType=${type}`,
          method: "GET",
        };
      },
    }),
  }),
});
export const {
  useLikedVideoByUserQuery,

  useLikeVideoMutation,
  useUnlikeVideoMutation,
  useGetAllProductsFeedQuery,
  useGetAllServicesFeedQuery,
} = feedService;
