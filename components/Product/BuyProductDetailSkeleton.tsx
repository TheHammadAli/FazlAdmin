export default function BuyProductDetailSkeleton() {
  return (
    <div className="h-full min-h-screen flex flex-col items-center">
      <div className="px-5 sm:px-10 h-[61px] border-b border-gray-9 bg-white w-full flex justify-center">
        <div className="w-full flex items-center gap-2 mt-5">
          <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      <div className="px-5 sm:px-10 py-6 w-full">
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="space-y-2 w-full md:w-[52%]">
            <div className="h-[220px] sm:h-[320px] md:h-[500px] animate-pulse rounded-[10px] bg-gray-200" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[96px] w-[96px] md:w-[154px] animate-pulse rounded-[10px] bg-gray-200"
                />
              ))}
            </div>
            <div className="mt-10 h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          </div>

          <div className="w-full md:w-[48%]">
            <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-32 animate-pulse rounded bg-gray-200" />

            <div className="mt-4 flex items-center gap-2">
              <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              </div>
            </div>

            <div className="mt-4 h-4 w-20 animate-pulse rounded bg-gray-200" />

            <div className="mt-4 border-t border-[#E5E5E5] py-4 flex justify-between">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>

            {[1, 2].map((i) => (
              <div
                key={i}
                className="border-t border-[#E5E5E5] py-4 flex justify-between"
              >
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            ))}

            <div className="mt-8 h-[46px] w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="mt-4 h-[46px] w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="mt-8 h-[46px] w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="mt-3 flex gap-3">
              <div className="h-[46px] flex-1 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-[46px] flex-1 animate-pulse rounded-xl bg-gray-200" />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <div className="h-[18px] w-[18px] animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="mt-8 border-t border-[#E5E5E5] pt-6">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
