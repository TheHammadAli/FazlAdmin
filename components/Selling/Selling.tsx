"use client";
import React, { useState } from "react";
import Image from "next/image";
import Tabs from "../Ui/Tabs";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { useRouter } from "next/navigation";
import PrivateListings from "./PrivateListings";
import MyShops from "./MyShops";
import reachMoreCustomerIcon from "@/assets/icons/reach-more-customer.svg";
import secureReliableIcon from "@/assets/icons/secure-reliable.svg";
import growBusinessImage from "@/assets/icons/grow-business.svg";
import productOverviewIcon from "@/assets/icons/services-green-icon.svg";
import {
  useGetUserProductsQuery,
  useGetUsersShopsQuery,
} from "@/store/services/sellingService";
import { useAppSelector } from "@/store/store";
import totalShopsIcon from "@/assets/icons/total-shops.svg";
import privateListingBanner from "@/assets/icons/private-listing-banner.svg";
import totalProductsIcon from "@/assets/icons/total-products-icon.svg";
function Selling() {
  const tabs = ["my_shops", "private_listing"];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const { placeholders, info_messages } = useDictionary();
  const router = useRouter();
  const userId = useAppSelector((state) => state.authReducer.userId);
  const {
    data: shopsData,
    isLoading: isShopsLoading,
    isFetching: isShopsFetching,
  } = useGetUsersShopsQuery(userId, { skip: !userId });
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useGetUserProductsQuery(userId, { skip: !userId });
  const isShopsTab = activeTab === tabs[0];
  const isOverviewLoading = isShopsTab
    ? isShopsLoading || isShopsFetching
    : isProductsLoading || isProductsFetching;
  const totalShops = shopsData?.data?.length ?? 0;
  const totalProducts = productsData?.data?.length ?? 0;
  const tabsComponents: { [key: string]: React.ReactNode } = {
    my_shops: <MyShops />,
    private_listing: <PrivateListings />,
  };

  return (
    <div className="p-6">
      <div className="border-b-[1px] border-gray-9 flex justify-between items-center w-full">
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div
          className="font-normal text-[13px] cursor-pointer text-green-2 hover:underline"
          onClick={() => {
            if (activeTab === tabs[0]) {
              router.push("/selling/create-shop");
            } else {
              router.push("/selling/list-product?type=personal");
            }
          }}
        >
          {activeTab === tabs[1]
            ? placeholders["Add listing"]
            : placeholders.create_shop}
        </div>
      </div>

      {activeTab === tabs[0] && <div className="mt-4 overflow-hidden rounded-[10px] bg-[rgb(245,249,248)] sm:mt-5 sm:rounded-[12px] xl:mt-6">
        <div className="flex items-end justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5 md:px-8 xl:gap-4 xl:px-10">
          <div className="min-w-0 flex-1 space-y-3 sm:space-y-3.5 xl:space-y-4">
            <div>
              <h3 className="text-[13px] font-medium text-[#030303] sm:text-[14px] xl:text-[16px]">
                {info_messages.grow_your_business}
              </h3>
              <p className="mt-0.5 max-w-full text-[11px] leading-snug text-[#4B514F] sm:mt-1 sm:text-[12px] md:text-[13px] xl:mt-0 xl:w-[297px] xl:text-[14px]">
                {info_messages.create_shop_sell_customers}
              </p>
            </div>
            <ul className="space-y-1 sm:space-y-1.5 xl:space-y-1.5">
              <li className="flex items-center gap-2 sm:gap-2.5 xl:gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DFF2EC] xl:h-6 xl:w-6">
                  <Image
                    src={reachMoreCustomerIcon}
                    alt=""
                    className="h-[11px] w-[11px] sm:h-3 sm:w-3 xl:h-[14px] xl:w-[14px]"
                  />
                </span>
                <span className="text-[11px] text-[#001907] sm:text-[12px] xl:text-[13px]">
                  {info_messages.reach_more_customers}
                </span>
              </li>
              <li className="flex items-center gap-2 sm:gap-2.5 xl:gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DFF2EC] xl:h-6 xl:w-6">
                  <Image
                    src={secureReliableIcon}
                    alt=""
                    className="h-[11px] w-[11px] sm:h-3 sm:w-3 xl:h-[14px] xl:w-[14px]"
                  />
                </span>
                <span className="text-[11px] text-[#001907] sm:text-[12px] xl:text-[13px]">
                  {info_messages.secure_and_reliable}
                </span>
              </li>
            </ul>
          </div>
          <div className="relative h-[120px] w-[148px] shrink-0 sm:h-[125px] sm:w-[168px] md:h-[132px] md:w-[200px] xl:h-[140px] xl:w-[225px]">
            <Image
              src={growBusinessImage}
              alt=""
              fill
              unoptimized
              className="object-contain object-bottom rtl:object-left ltr:object-right"
            />
          </div>
        </div>
      </div>}
      {
        activeTab === tabs[1] && <div className="mt-4 px-2 sm:px-8 py-3 flex items-center justify-between overflow-hidden rounded-[10px] bg-[rgb(245,249,248)] sm:mt-5 sm:rounded-[12px] xl:mt-6">
          <div>
            <h3 className="text-[13px] font-medium text-[#030303] sm:text-[14px] xl:text-[16px]">
              {placeholders.private_listing}
            </h3>
            <p className="mt-0.5 max-w-full text-[11px] leading-snug text-[#4B514F] sm:mt-1 sm:text-[12px] md:text-[13px] xl:mt-0 xl:w-[297px] xl:text-[14px]">
              {info_messages.manage_private_listings}
            </p>
          </div>
          <div>
            <Image
              src={privateListingBanner}
              alt=""
              className=" shrink-0"
            />
          </div>

        </div>
      }
      <div className="mt-4">
        <h2 className="mb-3 text-[14px] font-medium text-[#030303] sm:text-[15px]">
          {placeholders.overview}
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-9 bg-white">
          <div className="flex items-center gap-3 px-4 py-4">
            <Image
              src={isShopsTab ? totalShopsIcon : totalProductsIcon}
              alt=""
              className="shrink-0"
            />
            <div className="min-w-0 text-left">
              <p className="text-[12px] font-normal text-[#4B514F]">
                {isShopsTab
                  ? placeholders.total_shops
                  : placeholders.total_products}
              </p>
              {isOverviewLoading ? (
                <div className="mt-1 h-6 w-10 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-[15px] font-medium leading-tight text-[#030303]">
                  {isShopsTab ? totalShops : totalProducts}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">{tabsComponents[activeTab]}</div>
    </div>
  );
}

export default Selling;
