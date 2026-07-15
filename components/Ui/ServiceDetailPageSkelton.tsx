export default function ServiceDetailSkeleton() {
  return (
    <div className=" px-5 lg:px-10 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-gray-200" />

      <div className="flex flex-col md:flex-row gap-8 xl:gap-16">
        {/* LEFT: Image + thumbnails */}
        <div className="lg:col-span-2">
          {/* Main Image */}

          <div className="h-[280px] min-w-[250px] sm:h-[320px] md:h-[500px]  max-w-[496px] xl:w-[496px] animate-pulse rounded-xl bg-gray-200" />

          {/* Thumbnails */}
          <div className="mt-4 flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 w-20 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Service Details */}
        <div className="space-y-5">
          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            </div>
          </div>

          {/* Title */}
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />

          {/* Reviews */}
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-26 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-30 animate-pulse rounded bg-gray-200" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-4 w-full animate-pulse rounded bg-gray-200"
              />
            ))}
          </div>

          {/* CTA Button */}
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
