import { baseApi } from "../baseApi";
export const reviewService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    writeReview: build.mutation({
      query: (body) => ({
        url: "/reviews",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["REVIEW"],
    }),
    getAvgReviews: build.query({
      query: ({ type, id }) => ({
        url: `/reviews/average/${type}/${id}`,
        method: "GET",
      }),
      providesTags: ["REVIEW"],
    }),
    getReviewsList: build.query({
      query: (params) => ({
        url: `/reviews?${new URLSearchParams(params)}`,
        method: "GET",
      }),
      providesTags: ["REVIEW"],
    }),
  }),
});
export const {
  useWriteReviewMutation,
  useGetAvgReviewsQuery,
  useGetReviewsListQuery,
} = reviewService;
