"use client";

import { useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MessageSquare } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetBroadcastThreadMessagesQuery } from "@/store/services/adminService";

const MESSAGES_PER_PAGE = 15;

type ApiThreadMessage = {
    _id?: string;
    sender?: string;
    receiver?: string;
    message?: string;
    imageUrls?: string[];
    createdAt?: string;
};

type ApiThreadData = {
    thread?: { _id?: string } | null;
    messages?: ApiThreadMessage[];
    meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};

type ApiThreadResponse = { data?: ApiThreadData };

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

type BroadcastThreadModalProps = {
    open: boolean;
    broadcastId?: string;
    sellerId?: string;
    buyerName?: string;
    sellerName?: string;
    onClose: () => void;
};

function BroadcastThreadModal({
    open,
    broadcastId,
    sellerId,
    buyerName,
    sellerName,
    onClose,
}: BroadcastThreadModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching } = useGetBroadcastThreadMessagesQuery(
        { broadcastId: broadcastId ?? "", sellerId: sellerId ?? "", page, limit: MESSAGES_PER_PAGE },
        { skip: !open || !broadcastId || !sellerId },
    );
    const loading = isLoading || isFetching;

    const response = (data as ApiThreadResponse | undefined)?.data;
    const thread = response?.thread ?? null;
    // Backend sorts newest-first for pagination; reverse within the page so this page reads oldest-to-newest top-to-bottom.
    const messages = [...(response?.messages ?? [])].reverse();
    const totalPages = Math.max(1, Number(response?.meta?.totalPages) || 1);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(open) : value;
        if (!nextOpen) {
            setPage(1);
            onClose();
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar flex max-h-[85vh] w-[92vw] max-w-[520px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="shrink-0 border-b border-gray-9 px-6 pt-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <MessageSquare className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Conversation
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
                    <p className="mt-1 text-[12px] text-gray-11">
                        {buyerName ?? "Buyer"} &amp; {sellerName ?? "Seller"}
                    </p>
                </div>

                <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-5">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-12 w-2/3 animate-pulse rounded-[10px] bg-gray-200 ${index % 2 ? "ml-auto" : ""}`}
                                />
                            ))}
                        </div>
                    ) : !thread || messages.length === 0 ? (
                        <p className="py-8 text-center text-[13px] text-gray-11">
                            No conversation yet between the buyer and this seller.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isFromSeller = message.sender === sellerId;
                                return (
                                    <div
                                        key={message._id}
                                        className={`flex ${isFromSeller ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-[10px] px-3 py-2 ${isFromSeller ? "bg-green-4 text-[#001907]" : "bg-gray-10 text-[#001907]"
                                                }`}
                                        >
                                            <p className="text-[11px] font-medium text-gray-11">
                                                {isFromSeller ? sellerName ?? "Seller" : buyerName ?? "Buyer"}
                                            </p>
                                            {message.message && (
                                                <p className="mt-0.5 text-[14px] whitespace-pre-wrap break-words">
                                                    {message.message}
                                                </p>
                                            )}
                                            {message.imageUrls?.map((url, index) => (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    key={`${message._id}-${index}`}
                                                    src={url}
                                                    alt="Attachment"
                                                    className="mt-1.5 max-h-[160px] rounded-[8px] object-cover"
                                                />
                                            ))}
                                            <p className="mt-1 text-[10px] text-gray-11">
                                                {formatDateTime(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {!loading && thread && messages.length > 0 && totalPages > 1 && (
                    <div className="shrink-0 border-t border-gray-9 px-6 py-3">
                        <div className="flex items-center justify-between text-[12px] text-gray-11">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page <= 1}
                                className="cursor-pointer font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page >= totalPages}
                                className="cursor-pointer font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                <div className="shrink-0 border-t border-gray-9 px-6 py-4">
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-gray-9 px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default BroadcastThreadModal;
