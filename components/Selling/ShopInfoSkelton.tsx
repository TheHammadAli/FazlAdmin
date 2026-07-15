import React from "react";

export default function ShopInfoSkelton() {
  return (
    <div className="space-y-[16px] md:space-y-[20px]">
      <div className="flex items-center sm:items-end justify-between gap-3 sm:pl-6 sm:rtl:pr-6 mt-5 sm:-mt-5">
        <div className="flex items-center sm:items-end gap-[14px] min-w-0">
          <div className="h-[80px] w-[80px] min-w-[80px] rounded-full bg-gray-200 animate-pulse shadow-menu" />
          <div className="pb-1 space-y-2 min-w-0">
            <div className="h-[14px] w-32 max-w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-[14px] w-40 max-w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="shrink-0 h-[36px] w-[88px] rounded-xl bg-gray-200 animate-pulse" />
      </div>

      <div className="flex justify-between">
        <div className="h-[14px] w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-[14px] w-10 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-2 -mt-3">
        <div className="h-[15px] w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-[15px] w-5/6 bg-gray-200 rounded animate-pulse" />
        <div className="h-[15px] w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="h-[14px] w-[14px] shrink-0 rounded bg-gray-200 animate-pulse" />
          <div className="h-[14px] w-48 max-w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[14px] w-[11px] shrink-0 rounded bg-gray-200 animate-pulse" />
          <div className="h-[14px] w-56 max-w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="mt-4">
        <div className="h-[40px] w-[180px] rounded-xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
