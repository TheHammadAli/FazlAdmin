"use client";
import { useEffect, useState } from "react";
import { useGetAllServicesFeedQuery } from "@/store/services/feedService";
import ReelsFeed, { type ReelItem } from "./ReelsFeed";
import {
    resolveFeedEntityId,
    resolveFeedEntityImage,
} from "@/utils/feedEntity";

type ServiceFeedItem = {
    _id?: string;
    id?: string;
    title?: string;
    price?: number;
    video?: string;
    images?: string[];
    ownerId?: string | { _id?: string; id?: string; image?: string; images?: string[] };
    category?: ReelItem["category"];
};

type FeedResponseMeta = {
    totalPages?: number | string;
};

type FeedResponse = {
    data?: ServiceFeedItem[];
    meta?: FeedResponseMeta;
};

function ServiceFeeds() {
    const LIMIT = 10;
    const [page, setPage] = useState(1);
    const [services, setServices] = useState<ReelItem[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const { data: servicesFeed, isLoading, isFetching } = useGetAllServicesFeedQuery({ page, limit: LIMIT });
    const isInitialLoading = services.length === 0 && (isLoading || isFetching);

    useEffect(() => {
        const response = (servicesFeed as FeedResponse | undefined) ?? undefined;
        const mapped: ReelItem[] =
            response?.data
                ?.filter((service: ServiceFeedItem) => !!service.video)
                .map((service: ServiceFeedItem) => {
                    const ownerId = resolveFeedEntityId(service.ownerId);

                    return {
                        id: service._id ?? service.id ?? "",
                        video: service.video ?? "",
                        title: service.title ?? "",
                        price: String(service.price ?? 0),
                        category: service.category ?? "",
                        ownerId: ownerId || undefined,
                        ownerImage: resolveFeedEntityImage(service.ownerId),
                    };
                }) ?? [];

        setServices((prev) => {
            const map = new Map(prev.map((item) => [item.id, item]));
            mapped.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
        });

        const totalPages = Number(response?.meta?.totalPages ?? 1);
        setHasMore(page < totalPages);
    }, [servicesFeed, page]);

    const handleEndReached = () => {
        if (isFetching || !hasMore) return;
        setPage((prev) => prev + 1);
    };
    return (
        <div className="flex h-full min-h-0 w-full justify-center">
            <div className="h-full min-h-0 w-full max-w-full lg:max-w-[456px]">
                {isInitialLoading ? (
                    Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="h-[620px] w-full animate-pulse rounded-[8px] bg-gray-200" />
                    ))
                ) : services.length === 0 ? (
                    <div className="rounded-[8px] bg-white p-6 text-center text-sm text-gray-500">
                        No feed available
                    </div>
                ) : (
                    <ReelsFeed
                        type="services"
                        reels={services}
                        onEndReached={handleEndReached}
                        isLoadingMore={isFetching && page > 1}
                    />
                )}
            </div>
        </div>
    );
}

export default ServiceFeeds;