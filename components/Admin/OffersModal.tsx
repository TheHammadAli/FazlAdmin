"use client";

import { useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { HandCoins } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import {
    useGetBroadcastOffersQuery,
    useGetProductOffersQuery,
} from "@/store/services/adminService";

/**
 * Offers placed on one broadcast or one listing.
 *
 * Both sides return the same shape — who offered, how much, what they said and
 * where the offer stands — so this renders either. `kind` only picks which
 * query runs and what the empty state calls the thing.
 */

type ApiOfferer = {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
};

type ApiOffer = {
    id?: string;
    _id?: string;
    price?: number | null;
    message?: string;
    status?: string;
    createdAt?: string;
    respondedAt?: string | null;
    offerer?: ApiOfferer;
};

type OffersResponse = {
    data?: ApiOffer[];
    meta?: {
        total?: number;
        /** Listings only: a buyer may offer more than once, so people != rows. */
        offererCount?: number;
        pending?: number;
        accepted?: number;
        declined?: number;
        expired?: number;
    };
};

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-[#FDEAB8] text-[#946200]",
    accepted: "bg-green-4 text-green-1",
    declined: "bg-[#FDE2E5] text-[#E92440]",
    expired: "bg-gray-10 text-gray-8",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatDateTime(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatPrice(value?: number | null) {
    if (value === null || value === undefined) return "No price";
    return `Rs ${value.toLocaleString("en-US")}`;
}

type OffersModalProps = {
    kind: "broadcast" | "listing";
    /** Null closes the modal; the id is what it loads. */
    entityId: string | null;
    /** Shown under the heading — a broadcast code or a listing title. */
    subtitle?: string;
    onClose: () => void;
};

function OffersModal({ kind, entityId, subtitle, onClose }: OffersModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const isOpen = Boolean(entityId);

    // Both hooks are always called — hooks cannot be conditional — and the one
    // that does not apply is skipped, so only a single request goes out.
    const broadcastQuery = useGetBroadcastOffersQuery(entityId ?? "", {
        skip: !entityId || kind !== "broadcast",
    });
    const listingQuery = useGetProductOffersQuery(entityId ?? "", {
        skip: !entityId || kind !== "listing",
    });
    const query = kind === "broadcast" ? broadcastQuery : listingQuery;

    const { data, error, isLoading, isFetching, isError } = query;
    const loading = isLoading || isFetching;

    const response = data as OffersResponse | undefined;
    const offers = response?.data ?? [];
    const meta = response?.meta;
    const total = meta?.total ?? offers.length;
    const people = meta?.offererCount ?? total;

    const errorMessage = isError
        ? ((error as { data?: { message?: string } })?.data?.message ??
          "Failed to load offers. Please try again.")
        : null;

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) onClose();
    }

    const counters: { label: string; value: number }[] = [
        { label: "Pending", value: meta?.pending ?? 0 },
        { label: "Accepted", value: meta?.accepted ?? 0 },
        { label: "Declined", value: meta?.declined ?? 0 },
        ...(kind === "listing" ? [{ label: "Expired", value: meta?.expired ?? 0 }] : []),
    ];

    return (
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar max-h-[80vh] w-[92vw] max-w-[560px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <HandCoins className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Offers
                        </h2>
                        {subtitle && (
                            <p className="mt-1 truncate text-[12px] text-gray-11">{subtitle}</p>
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
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-20 animate-pulse rounded-[10px] bg-gray-200" />
                        ))}
                    </div>
                ) : errorMessage ? (
                    <p className="mt-6 text-[14px] text-[#E92440]">{errorMessage}</p>
                ) : offers.length === 0 ? (
                    <p className="mt-6 text-[14px] text-gray-11">
                        No offers on this {kind === "broadcast" ? "broadcast" : "listing"} yet.
                    </p>
                ) : (
                    <>
                        <p className="mt-4 text-[12px] font-medium uppercase tracking-wide text-gray-6">
                            {people} user{people === 1 ? "" : "s"} offered
                            {total !== people ? ` · ${total} offers` : ""}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                            {counters.map((c) => (
                                <span
                                    key={c.label}
                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[11px] font-medium ${STATUS_STYLES[c.label.toLowerCase()] ?? "bg-gray-10 text-gray-8"
                                        }`}
                                >
                                    {c.label}: {c.value}
                                </span>
                            ))}
                        </div>

                        <div className="mt-3 space-y-2">
                            {offers.map((offer) => (
                                <div
                                    key={offer.id ?? offer._id}
                                    className="rounded-[10px] border border-gray-9 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB] text-[13px] font-medium text-[#030303]">
                                            {getInitials(offer.offerer?.name ?? "-")}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[14px] font-medium text-[#001907]">
                                                {offer.offerer?.name ?? "-"}
                                            </p>
                                            <p className="truncate text-[12px] text-gray-11">
                                                {offer.offerer?.email ?? offer.offerer?.phone ?? "-"}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[14px] font-semibold text-[#001907]">
                                                {formatPrice(offer.price)}
                                            </p>
                                            <span
                                                className={`mt-1 inline-flex rounded-[4px] px-2 py-1 text-[11px] font-medium ${STATUS_STYLES[offer.status ?? ""] ?? "bg-gray-10 text-gray-8"
                                                    }`}
                                            >
                                                {offer.status ?? "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {offer.message && (
                                        <p className="mt-2 whitespace-pre-wrap break-words text-[13px] text-gray-8">
                                            {offer.message}
                                        </p>
                                    )}

                                    <p className="mt-2 text-[11px] text-gray-11">
                                        Offered {formatDateTime(offer.createdAt)}
                                        {offer.respondedAt
                                            ? ` · Answered ${formatDateTime(offer.respondedAt)}`
                                            : ""}
                                    </p>
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

export default OffersModal;
