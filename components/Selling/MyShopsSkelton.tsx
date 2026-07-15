import React from "react";

const MyShopsSkeleton = () => {
  return (
    <div className="p-4 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse flex flex-col items-center px-4 py-[34px] border border-gray-200 rounded-xl"
        >
          {/* Circle placeholder for logo */}
          <div className="w-20 h-20 rounded-full bg-gray-300 mb-4"></div>

          {/* Text placeholders */}
          <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 w-32 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default MyShopsSkeleton;
