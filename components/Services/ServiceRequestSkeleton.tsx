"use client";

type ServiceRequestSkeletonProps = {
    count?: number;
};

function ServiceRequestSkeleton({ count = 4 }: ServiceRequestSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={`service-request-skeleton-${index}`}
                    className="animate-pulse border-b border-gray-9 py-4"
                >
                    <div className="flex items-start gap-3">
                        <div className="h-[60px] w-[60px] rounded-[8px] bg-gray-4" />
                        <div className="min-w-0 flex-1">
                            <div className="h-4 w-2/3 rounded bg-gray-4" />
                            <div className="mt-2 h-4 w-1/2 rounded bg-gray-4" />
                            <div className="mt-2 h-4 w-1/3 rounded bg-gray-4" />
                        </div>
                    </div>
                    <div className="mt-4 h-4 w-1/2 rounded bg-gray-4" />
                    <div className="mt-2 h-4 w-1/4 rounded bg-gray-4" />
                    <div className="mt-3 flex items-center gap-[9px]">
                        <div className="h-[42px] w-full rounded-[6px] bg-gray-4" />
                    </div>
                </div>
            ))}
        </>
    );
}

function NavCardSkeleton() {
    return (
        <div className="flex w-full items-center gap-3 rounded-[14px] border border-gray-9 bg-white px-3 py-3">
            <div className="h-11 w-11 shrink-0 rounded-[10px] bg-gray-4" />
            <div className="min-w-0 flex-1">
                <div className="h-4 w-1/2 rounded bg-gray-4" />
                <div className="mt-2 h-3 w-3/4 rounded bg-gray-4" />
            </div>
            <div className="h-3.5 w-2.5 shrink-0 rounded bg-gray-4" />
        </div>
    );
}

export function OfferedServicesPageSkeleton() {
    return (
        <div
            className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="w-full shrink-0 animate-pulse px-0 pb-4 pt-3 sm:pt-4">
                <div className="w-full overflow-hidden rounded-[16px] border border-gray-9 bg-white">
                    <div className="h-[180px] w-full bg-gray-4 sm:h-[220px]" />
                    <div className="px-4 pb-4 pt-4 sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-4" />
                                <div className="min-w-0 flex-1">
                                    <div className="h-4 w-2/3 rounded bg-gray-4" />
                                    <div className="mt-2 h-3 w-1/3 rounded bg-gray-4" />
                                </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <div className="h-9 w-9 rounded-[8px] bg-gray-4" />
                                <div className="h-9 w-9 rounded-[8px] bg-gray-4" />
                            </div>
                        </div>
                        <div className="mt-4 h-[44px] w-full rounded-[10px] bg-gray-4" />
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:max-h-[calc(115dvh-210px)] lg:flex-row">
                <div className="flex w-full shrink-0 animate-pulse flex-col border-b border-gray-9 bg-white px-3 pb-3 pt-3 sm:px-4 sm:pt-4 lg:min-h-0 lg:w-[min(340px,100%)] lg:max-w-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
                    <div className="flex flex-col gap-3">
                        <NavCardSkeleton />
                        <NavCardSkeleton />
                        <NavCardSkeleton />
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col bg-white lg:min-h-0">
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
                        <ServiceRequestSkeleton count={4} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ServiceRequestSkeleton;
