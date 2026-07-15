"use client";
import React from "react";
import Image from "next/image";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { useGetUserProductsQuery } from "@/store/services/sellingService";
import { useRouter } from "next/navigation";
import noProductsOrShopIcon from "@/assets/icons/no-products-or-shop.svg";
import { useAppSelector } from "@/store/store";
import CatalogListCard, {
  CatalogListCardItem,
  CatalogListCardSkeleton,
} from "../Home/CatalogListCard";

function PrivateListings() {
  const { placeholders, info_messages, currentLanguage } = useDictionary();
  const userId = useAppSelector((state) => state.authReducer.userId);
  const router = useRouter();

  const {
    data: products,
    isLoading,
    isFetching,
  } = useGetUserProductsQuery(userId, { skip: !userId });

  const loading = isLoading || isFetching;

  return (
    <div className="md:px-4 py-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-black-1 font-medium text-[16px]">
            {placeholders.total}
          </h1>
          {loading ? (
            <div className="mt-1 h-[14px] w-[50px] animate-pulse rounded-full bg-gray-200" />
          ) : (
            <h4 className="text-[14px] text-gray-8">
              {products?.data.length ?? 0}{" "}
              {products?.data.length > 1
                ? placeholders.products
                : placeholders.product}
            </h4>
          )}
        </div>
      </div>

      {loading ? (
        <CatalogListCardSkeleton />
      ) : userId && products?.data?.length > 0 ? (
        <div className="mt-4 flex flex-col gap-4">
          {products.data.map((product: CatalogListCardItem) => {
            const productId = product?.id || product?._id;
            return (
              <CatalogListCard
                key={productId}
                item={product}
                buttonLabel={placeholders.see_ad}
                currencyLabel={placeholders.Rs}
                currentLanguage={currentLanguage}
                onButtonClick={() => {
                  if (!productId) return;
                  router.push(
                    `/selling/product-detail?id=${productId}&type=personal`,
                  );
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[300px] w-full items-center justify-center px-4 py-10">
          <div className="flex max-w-[320px] flex-col items-center text-center">
            <Image
              src={noProductsOrShopIcon}
              alt=""
              width={140}
              height={140}
              unoptimized
              className="h-auto w-[140px] max-w-full"
            />
            <h2 className="mt-4 text-[16px] font-medium text-[#030303] sm:text-[18px]">
              {info_messages.no_products_yet}
            </h2>
            <p className="mt-2 text-[14px] font-normal leading-relaxed text-[#4B514F]">
              {info_messages.no_private_listings_subtitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivateListings;
