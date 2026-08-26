"use client";

import { useRef, useState } from "react";
import { X, Eye, Heart, Share2, type LucideIcon } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import Pagination from "@/components/Ui/Pagination";
import {
    useGetFeedLikersQuery,
    useGetFeedSharersQuery,
    useGetFeedViewersQuery,
} from "@/store/services/adminService";

const PAGE_LIMIT = 20;

type MetricType = "views" | "likes" | "shares";

type EngagementUser = { _id?: string; name?: string; email?: string };
type EngagementRow = { _id?: string; createdAt?: string; user?: EngagementUser };
type EngagementResponse = {
    data?: EngagementRow[];
    meta?: { total?: number; totalPages?: number };
};

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

const METRIC_TABS: { metricType: MetricType; label: string; icon: LucideIcon }[] = [
    { metricType: "views", label: "Views", icon: Eye },
    { metricType: "likes", label: "Likes", icon: Heart },
    { metricType: "shares", label: "Shares", icon: Share2 },
];

function FeedEngagementModal({
    open,
    onClose,
    itemId,
    itemType,
    initialMetricType,
    videoTitle,
    counts,
    visibleMetrics = ["views", "likes", "shares"],
}: {
    open: boolean;
    onClose: () => void;
    itemId: string;
    itemType: "product" | "service";
    initialMetricType: MetricType;
    videoTitle: string;
    counts: Partial<Record<MetricType, number>>;
    visibleMetrics?: MetricType[];
}) {
    const [activeMetric, setActiveMetric] = useState<MetricType>(initialMetricType);
    const [page, setPage] = useState(1);
    const modalRef = useRef<HTMLDivElement>(null);
    const tabs = METRIC_TABS.filter((tab) => visibleMetrics.includes(tab.metricType));

    const args = { itemId, itemType, page, limit: PAGE_LIMIT };
    const likersQuery = useGetFeedLikersQuery(args, { skip: !open || activeMetric !== "likes" });
    const sharersQuery = useGetFeedSharersQuery(args, { skip: !open || activeMetric !== "shares" });
    const viewersQuery = useGetFeedViewersQuery(args, { skip: !open || activeMetric !== "views" });

    const active =
        activeMetric === "likes" ? likersQuery : activeMetric === "shares" ? sharersQuery : viewersQuery;

    const response = active.data as EngagementResponse | undefined;
    const rows = response?.data ?? [];
    const loading = active.isLoading || active.isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    function handleClose() {
        setPage(1);
        setActiveMetric(initialMetricType);
        onClose();
    }

    function switchMetric(metricType: MetricType) {
        if (metricType === activeMetric) return;
        setActiveMetric(metricType);
        setPage(1);
    }

    return (
        <Modal
            editModalRef={modalRef}
            open={open}
            setOpen={(value) => {
                const nextOpen = typeof value === "function" ? value(open) : value;
                if (!nextOpen) handleClose();
            }}
            centered
        >
            <div className="hide-scrollbar w-[92vw] max-w-[460px] rounded-[12px] bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-[16px] font-semibold text-[#001907]">
                            {tabs.length === 1 ? tabs[0].label : "Engagement"}
                        </h2>
                        <p className="mt-0.5 truncate text-[12px] text-gray-11">{videoTitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                    >
                        <X className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                {tabs.length > 1 && (
                    <div className="mt-4 flex gap-2 border-b border-gray-9">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = tab.metricType === activeMetric;
                            return (
                                <button
                                    type="button"
                                    key={tab.metricType}
                                    onClick={() => switchMetric(tab.metricType)}
                                    className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-1 pb-2 text-[13px] font-medium transition-colors ${isActive
                                        ? "border-green-1 text-green-1"
                                        : "border-transparent text-gray-11 hover:text-gray-8"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" strokeWidth={2} />
                                    {tab.label}
                                    <span className="text-[12px]">({(counts[tab.metricType] ?? 0).toLocaleString()})</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
                    {loading &&
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={`sk-${i}`} className="h-12 w-full animate-pulse rounded-[8px] bg-gray-200" />
                        ))}

                    {!loading && rows.length === 0 && (
                        <p className="py-8 text-center text-[14px] text-gray-11">
                            No one yet
                        </p>
                    )}

                    {!loading &&
                        rows.map((row, index) => (
                            <div
                                key={row.user?._id ?? row._id ?? index}
                                className="flex items-center justify-between gap-3 rounded-[8px] border-b border-gray-10 py-2.5 last:border-b-0"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[14px] font-normal text-[#001907]">
                                        {row.user?.name ?? "-"}
                                    </p>
                                    <p className="truncate text-[12px] text-gray-11">
                                        {row.user?.email ?? "-"}
                                    </p>
                                </div>
                                <span className="shrink-0 whitespace-nowrap text-[12px] text-gray-11">
                                    {fmtDateTime(row.createdAt)}
                                </span>
                            </div>
                        ))}
                </div>

                {!loading && pageCount > 1 && (
                    <Pagination pageCount={pageCount} currentPage={page} onPageChange={setPage} />
                )}
            </div>
        </Modal>
    );
}

export default FeedEngagementModal;
