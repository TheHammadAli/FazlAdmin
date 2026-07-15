"use client";

export default function CategoriesSkeleton() {
  return (
    <div className="w-full mx-auto bg-white divide-y divide-gray-200  ">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between px-4 py-3 animate-pulse"
        >
          {/* Left side (icon + text placeholder) */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-300 rounded" />
            <div className="h-4 w-32 bg-gray-300 rounded" />
          </div>

          {/* Right arrow placeholder */}
          <div className="w-4 h-4 bg-gray-300 rounded" />
        </div>
      ))}
    </div>
  );
}
