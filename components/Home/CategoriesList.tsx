"use client";
import React from "react";
import Image from "next/image";
import CategoriesSkeleton from "../Services/CategoriesSkeleton";
import crossIcon from "@/assets/icons/cross-icon.svg";
import { useCategoriesQuery } from "@/custom-hooks/useCategoriesQuery";
import CategoryImg from "@/assets/icons/category-icon.png";
import chevron from "@/assets/icons/chev-down-icon.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";

export interface categroyTypes {
  _id: string;
  name: string;
}
function CategoriesList({
  categoryId,
  setCategoryId,
}: {
  categoryId: string;
  setCategoryId: (val: string) => void;
}) {
  const { placeholders, error_messages } = useDictionary();
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = useCategoriesQuery("");
  return (
    <div className=" shadow-2xl rounded-b-[12px]">
      {isCategoriesLoading || isCategoriesFetching ? (
        <CategoriesSkeleton />
      ) : categories?.data?.length > 0 ? (
        <>
          {categories?.data?.map((category: categroyTypes, index: number) => (
            <div
              onClick={() => {
                if (category?._id === categoryId) {
                  setCategoryId("");
                } else {
                  setCategoryId(category?._id);
                }
                // setIsCatOpen(false);
              }}
              key={index}
              className={`${category?._id === categoryId && "bg-green-3"
                } cursor-pointer px-[15px] py-[16px]  flex justify-between items-center border-b-[1px] border-gray-9`}
            >
              <div className="flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="#007781"
                  className="h-[24px] w-[24px]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                <h2 className="text-[15px] rtl:text-right ltr:text-left font-medium text-black-1">
                  {category?.name}
                </h2>
              </div>
              <Image
                src={chevron}
                alt="chevron"
                className=" -rotate-90 rtl:rotate-90"
              />
            </div>
          ))}
        </>
      ) : (
        <div className="h-[410px] w-full flex items-center justify-center">
          <h1 className="text-black-3 text-[16px] font-medium">
            {error_messages.no_categories}
          </h1>
        </div>
      )}
    </div>
  );
}

export default CategoriesList;
