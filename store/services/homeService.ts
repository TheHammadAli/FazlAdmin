import { baseApi } from "../baseApi";

export type GetProductDetailParams = string | { id: string; userId?: string };

function normalizeProductDetailParams(
  params: GetProductDetailParams,
): { id: string; userId?: string } {
  if (typeof params === "string") {
    return { id: params };
  }
  return params;
}

export const homeService = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchProducts: build.query({
      query: (params: any) => {
        return {
          url: `/search/all-products?${new URLSearchParams(params)}`,
          method: "GET",
        };
      },
    }),
    searchServices: build.query({
      query: (params: any) => {
        return {
          url: `/search/all-services?${new URLSearchParams(params)}`,
          method: "GET",
        };
      },
    }),
    getProductDetail: build.query({
      query: (params: GetProductDetailParams) => {
        const { id, userId } = normalizeProductDetailParams(params);
        const search = userId ? `?${new URLSearchParams({ userId })}` : "";
        return {
          url: `/products/detail/${id}${search}`,
          method: "GET",
        };
      },
      providesTags: ["PRODUCT"],
    }),
  }),
});
export const {
  useGetProductDetailQuery,
  useSearchProductsQuery,
  useSearchServicesQuery,
} = homeService;
