"use client";

import { useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Radio } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetBroadcastDetailQuery } from "@/store/services/adminService";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";

type ApiBroadcastDetail = {
    _id?: string;
    broadcastCode?: string;
    message?: string;
    address?: string;
    purpose?: "Buying" | "Selling";
    type?: "product" | "service";
    status?: "open" | "closed";
    radius?: number;
    createdAt?: string;
    location?: { type?: string; coordinates?: [number, number] };
    category?: { name?: { en?: string; ur?: string } } | string;
    buyer?: { name?: string; email?: string; phone?: string };
    sentTo?: number;
    repliedSellers?: number;
};

const STATUS_BADGE_STYLES: Record<string, string> = {
    open: "bg-green-4 text-green-1",
    closed: "bg-gray-10 text-gray-8",
};

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

type BroadcastDetailModalProps = {
    broadcastId: string | null;
    onClose: () => void;
};

function BroadcastDetailModal({ broadcastId, onClose }: BroadcastDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetBroadcastDetailQuery(broadcastId ?? "", {
        skip: !broadcastId,
    });
    const broadcast = (data as { data?: ApiBroadcastDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const isOpen = Boolean(broadcastId);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    const coordinates = broadcast?.location?.coordinates;

    return (
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="flex max-h-[90vh] w-[92vw] max-w-[540px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Radio className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Broadcast Details
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 items-center justify-center"
                    >
                        <XMarkIcon className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-5">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="h-16 w-full animate-pulse rounded-[10px] bg-gray-200" />
                            <div className="h-24 w-full animate-pulse rounded-[10px] bg-gray-200" />
                        </div>
                    ) : !broadcast ? (
                        <p className="text-[14px] text-gray-11">Broadcast not found.</p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-gray-10 p-4">
                                <div className="min-w-0">
                                    <p className="truncate text-[16px] font-semibold text-[#001907]">
                                        {broadcast.broadcastCode ?? "-"}
                                    </p>
                                    <p className="truncate text-[13px] text-gray-11">
                                        By {broadcast.buyer?.name ?? "-"}
                                    </p>
                                </div>
                                {broadcast.status && (
                                    <span
                                        className={`inline-flex shrink-0 rounded-[4px] px-2 py-1 text-[12px] font-medium capitalize ${STATUS_BADGE_STYLES[broadcast.status] ?? "bg-gray-10 text-gray-8"}`}
                                    >
                                        {broadcast.status}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5">
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Message
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-[14px] text-[#001907]">
                                    {broadcast.message ?? "-"}
                                </p>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Purpose
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {broadcast.purpose ?? "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Type
                                    </p>
                                    <p className="mt-1 text-[14px] capitalize text-[#001907]">
                                        {broadcast.type ?? "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Category
                                    </p>
                                    <p className="mt-1 text-[14px] capitalize text-[#001907]">
                                        {getFeedCategoryLabel(broadcast.category ?? "", "en") || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Radius
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {broadcast.radius != null ? `${broadcast.radius} km` : "-"}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Location / Area
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {broadcast.address ?? "-"}
                                        {coordinates && coordinates.length === 2 && (
                                            <span className="ml-1.5 text-[12px] text-gray-11">
                                                ({coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)})
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Sent To
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {broadcast.sentTo ?? 0} recipient{broadcast.sentTo === 1 ? "" : "s"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Replied
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {broadcast.repliedSellers ?? 0}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Created
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {formatDateTime(broadcast.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex shrink-0 justify-end border-t border-gray-9 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-gray-9 px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default BroadcastDetailModal;
