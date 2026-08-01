"use client";

import { useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Users } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetBroadcastRecipientsQuery } from "@/store/services/adminService";

type ApiRecipient = {
    sellerId?: string;
    name?: string;
    email?: string;
    image?: string | null;
    phone?: string;
    sentAt?: string;
    hasReplied?: boolean;
    repliedAt?: string;
};

type RecipientsResponse = {
    data?: ApiRecipient[];
    meta?: { total?: number };
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

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

type BroadcastRecipientsModalProps = {
    broadcastId: string | null;
    broadcastCode?: string;
    onClose: () => void;
};

function BroadcastRecipientsModal({ broadcastId, broadcastCode, onClose }: BroadcastRecipientsModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, error, isLoading, isFetching, isError } = useGetBroadcastRecipientsQuery(
        broadcastId ?? "",
        { skip: !broadcastId },
    );
    const loading = isLoading || isFetching;

    const recipients = (data as RecipientsResponse | undefined)?.data ?? [];
    const total = (data as RecipientsResponse | undefined)?.meta?.total ?? recipients.length;
    const errorMessage = isError
        ? (error as { data?: { message?: string }; status?: number })?.data?.message ??
          "Failed to load recipients. Please try again."
        : null;

    const isOpen = Boolean(broadcastId);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    return (
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar max-h-[80vh] w-[92vw] max-w-[560px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <Users className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Broadcast Recipients
                        </h2>
                        {broadcastCode && (
                            <p className="mt-1 text-[12px] text-gray-11">{broadcastCode}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                    >
                        <XMarkIcon className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                {loading ? (
                    <div className="mt-5 space-y-2.5">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="h-14 animate-pulse rounded-[10px] bg-gray-200" />
                        ))}
                    </div>
                ) : errorMessage ? (
                    <p className="mt-6 text-[14px] text-[#E92440]">{errorMessage}</p>
                ) : recipients.length === 0 ? (
                    <p className="mt-6 text-[14px] text-gray-11">No recipients found.</p>
                ) : (
                    <>
                        <p className="mt-4 text-[12px] font-medium uppercase tracking-wide text-gray-6">
                            {total} seller{total === 1 ? "" : "s"} received this broadcast
                        </p>
                        <div className="mt-2 space-y-2">
                            {recipients.map((recipient) => (
                                <div
                                    key={recipient.sellerId ?? recipient.email}
                                    className="flex items-center gap-3 rounded-[10px] border border-gray-9 p-3"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB] text-[13px] font-medium text-[#030303]">
                                        {getInitials(recipient.name ?? "-")}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-medium text-[#001907]">
                                            {recipient.name ?? "-"}
                                        </p>
                                        <p className="truncate text-[12px] text-gray-11">
                                            {recipient.email ?? "-"}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span
                                            className={`inline-flex rounded-[4px] px-2 py-1 text-[11px] font-medium ${recipient.hasReplied
                                                ? "bg-green-4 text-green-1"
                                                : "bg-gray-10 text-gray-8"
                                                }`}
                                        >
                                            {recipient.hasReplied ? "Replied" : "No reply"}
                                        </span>
                                        <p className="mt-1 text-[11px] text-gray-11">
                                            {formatDateTime(recipient.sentAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-6 flex justify-end">
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

export default BroadcastRecipientsModal;
