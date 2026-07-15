// components/ProductSkeleton.js
export default function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border-gray-200 p-2 shadow-sm"
        >
          {/* Image placeholder */}
          <div className="h-40 w-full rounded-lg bg-gray-200"></div>

          {/* Title */}
          <div className="mt-4 h-4 w-2/3 rounded bg-gray-200"></div>

          {/* Rating */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-4 w-24 rounded bg-gray-200"></div>
            <div className="h-4 w-6 rounded bg-gray-200"></div>
          </div>

          {/* Price */}
          <div className="mt-3 h-4 w-16 rounded bg-gray-200"></div>
        </div>
      ))}
    </div>
  );
}
