import React, { Suspense } from "react";
export default function ProfileInfoSkeleton() {
  return (
    <Suspense fallback={null}>
      <div className="w-full">
        <div className="px-6 xl:px-0 h-[61px] border-b border-gray-200 bg-white flex justify-center">
          <div className="w-full max-w-[520px] flex items-center gap-2 mt-5">
            <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Edit profile skeleton */}
        <div className="px-6 xl:px-0 flex justify-center">
          <div className="w-full max-w-[520px] mt-5">
            {/* Profile Image */}
            <div className="flex gap-3 items-center">
              <div className="h-[62px] w-[62px] rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Name field */}
            <div className="mt-6 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Email field */}
            <div className="mt-6 space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Location field */}
            <div className="mt-6 space-y-2">
              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Choose map link */}
            <div className="mt-4 h-3 w-32 bg-gray-200 rounded animate-pulse" />

            {/* Save button */}
            <div className="mt-8 flex justify-center sm:justify-start lg:justify-end">
              <div className="h-[55px] w-full sm:w-[222px] bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
