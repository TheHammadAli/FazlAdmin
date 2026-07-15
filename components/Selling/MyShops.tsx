"use client";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React from "react";
import Image from "next/image";
import filterIcon from "@/assets/icons/filter-icon.svg";
import { useGetUsersShopsQuery } from "@/store/services/sellingService";
import noImageAvtar from "@/assets/images/no-image-av.png";
import MyShopsSkeleton from "./MyShopsSkelton";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/store";
interface shopTypes {
  title: string;
  id: string;
  image: string;
  description: string;
}
function MyShops() {
  const router = useRouter();
  const { placeholders, error_messages } = useDictionary();
  const userId = useAppSelector((state) => state.authReducer.userId);
  const { data, isLoading, isFetching, isError, error } =
    useGetUsersShopsQuery(userId, { skip: !userId });
  const loading = isLoading || isFetching;
  if (isError) {
    return (
      <div className="h-[80vh] flex items-center justify-center w-full text-red-1">
        {error_messages.shop_error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center px-3.5 mt-6">
        <div>
          <h1 className="text-black-1 text-[16px]">{placeholders.total}</h1>
          {loading ? (
            <div className="h-[14px] rounded-full w-[50px] bg-gray-200 animate-pulses"></div>
          ) : (
            <h4 className="text-[14px] text-gray-8">
              {data?.data.length ?? 0}{" "}
              {data?.data.length > 1 ? placeholders.shops : placeholders.shop}
            </h4>
          )}
        </div>
        {/* <div className="px-[12px] h-[38px] text-[14px] rounded-full border-[1px] border-gray-9 flex items-center gap-2">
          <Image src={filterIcon} alt="filter_icon" />
          {placeholders.filter}
        </div> */}
      </div>

      {/* listing  */}
      {!loading && data?.data.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2  sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-5">
          {data?.data.map((shop: shopTypes, index: number) => {
            return (
              <div
                key={index}
                className="px-2 py-[34px] border-[2px] rounded-[24px] border-gray-9 flex flex-col gap-3 items-center cursor-pointer"
                onClick={() =>
                  router.push(`/selling/shop-detail?id=${shop?.id}`)
                }
              >
                <Image
                  src={
                    shop?.image
                      ? `${shop?.image}?t=${Date.now()}`
                      : noImageAvtar
                  }
                  alt="shop_image"
                  height={100}
                  unoptimized
                  width={100}
                  className="h-[86px] w-[86px] rounded-full object-cover bg-gray-4"
                />
                <h2 className="font-medium  text-[16px] text-black-3 text-center">
                  {shop?.title ?? ""}
                </h2>
                <p className="w-[160px] truncate   text-[14px] text-center text-gray-13">
                  {shop.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
      {
        // no data found
        !loading && data?.data?.length === 0 && (
          <div className="h-[80vh] flex items-center justify-center w-full text-black-1">
            {error_messages.no_shops_data}
          </div>
        )
      }
      {loading && <MyShopsSkeleton />}
    </div>
  );
}

export default MyShops;
