export default function AllProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
      {Array.from({ length: 12 }).map((_, i) => (

        <div
          key={i}
          className="animate-pulse rounded-2xl border-gray-200 p-2 shadow-sm"
        >

          {/* Image placeholder */}
          <div className="h-40 lg:h-[276px] w-full rounded-2xl bg-gray-200"></div>

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
