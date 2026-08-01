"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { Ban, Trash2 } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import {
    useGetAllBroadcastsForAdminQuery,
    useCloseBroadcastMutation,
    useDeleteBroadcastMutation,
} from "@/store/services/adminService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import searchIcon from "@/assets/icons/searchIcon.svg";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type BroadcastStatus = "open" | "closed";

const STATUS_FILTERS: { label: string; value: BroadcastStatus | "" }[] = [
    { label: "All", value: "" },
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
];

const STATUS_BADGE_STYLES: Record<BroadcastStatus, string> = {
    open: "bg-green-4 text-green-1",
    closed: "bg-gray-10 text-gray-8",
};

type Broadcast = {
    id: string;
    broadcastCode: string;
    buyerName: string;
    message: string;
    purpose: string;
    type: string;
    status: BroadcastStatus;
    sentTo: number;
    repliedSellers: number;
    createdAt: string;
};

type ApiBroadcast = {
    _id?: string;
    broadcastCode?: string;
    buyerInfo?: { name?: string };
    message?: string;
    purpose?: string;
    type?: string;
    status?: BroadcastStatus;
    sentTo?: number;
    repliedSellers?: number;
    createdAt?: string;
};

type BroadcastsResponse = {
    data?: ApiBroadcast[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function mapApiBroadcast(broadcast: ApiBroadcast): Broadcast {
    return {
        id: broadcast._id ?? "",
        broadcastCode: broadcast.broadcastCode ?? "-",
        buyerName: broadcast.buyerInfo?.name ?? "-",
        message: broadcast.message ?? "-",
        purpose: broadcast.purpose ?? "-",
        type: broadcast.type ?? "-",
        status: broadcast.status ?? "open",
        sentTo: broadcast.sentTo ?? 0,
        repliedSellers: broadcast.repliedSellers ?? 0,
        createdAt: formatDate(broadcast.createdAt),
    };
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

type PendingAction = {
    broadcast: Broadcast;
    action: "close" | "delete";
};

function AdminBroadcasts() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<BroadcastStatus | "">("");
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const confirmModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: broadcastsResponse,
        isLoading,
        isFetching,
    } = useGetAllBroadcastsForAdminQuery({
        page,
        limit: PAGE_LIMIT,
        search,
        status: statusFilter,
    });

    const [closeBroadcast, { isLoading: isClosing }] = useCloseBroadcastMutation();
    const [deleteBroadcast, { isLoading: isDeleting }] = useDeleteBroadcastMutation();
    const isProcessing = isClosing || isDeleting;

    const broadcasts = ((broadcastsResponse as BroadcastsResponse | undefined)?.data ?? []).map(
        mapApiBroadcast,
    );

    const totalBroadcasts =
        parsePositiveInt((broadcastsResponse as BroadcastsResponse | undefined)?.meta?.total) ??
        broadcasts.length;

    const pageCount =
        parsePositiveInt((broadcastsResponse as BroadcastsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalBroadcasts / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    function openConfirmModal(broadcast: Broadcast, action: "close" | "delete") {
        setPendingAction({ broadcast, action });
        setIsConfirmModalOpen(true);
    }

    function closeConfirmModal() {
        if (isProcessing) return;
        setIsConfirmModalOpen(false);
        setPendingAction(null);
    }

    async function handleConfirm() {
        if (!pendingAction) return;

        try {
            if (pendingAction.action === "close") {
                const response = await closeBroadcast(pendingAction.broadcast.id).unwrap();
                toast.success(response?.message ?? "Broadcast closed successfully");
            } else {
                const response = await deleteBroadcast(pendingAction.broadcast.id).unwrap();
                toast.success(response?.message ?? "Broadcast deleted successfully");
            }
            setIsConfirmModalOpen(false);
            setPendingAction(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <section>
            <Modal
                editModalRef={confirmModalRef}
                open={isConfirmModalOpen}
                setOpen={setIsConfirmModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingAction?.action === "close" ? "Close broadcast" : "Delete broadcast"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        {pendingAction?.action === "close"
                            ? "Are you sure you want to close this broadcast? Sellers will no longer be able to respond."
                            : "Are you sure you want to delete this broadcast? This can be reversed only from the database."}
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeConfirmModal}
                            disabled={isProcessing}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={handleConfirm}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isProcessing ? <BeatLoader color="white" size={8} /> : "Confirm"}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Echo Broadcasts
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        View and manage all broadcasts on the marketplace
                    </p>
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center justify-between gap-3 px-5 lg:px-10">
                    <div className="relative max-w-[320px] flex-1">
                        <Image
                            src={searchIcon}
                            alt=""
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by buyer name or message..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={filter.label}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(filter.value);
                                    setPage(1);
                                }}
                                className={`h-9 cursor-pointer rounded-[8px] border px-3 text-[13px] font-medium transition-colors ${
                                    statusFilter === filter.value
                                        ? "border-green-1 bg-green-1 text-white"
                                        : "border-gray-9 bg-white text-gray-8 hover:border-green-1 hover:text-green-1"
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1060px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Buyer
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Message
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Type
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Sent To
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Replied
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Created
                                    </th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 9 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && broadcasts.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No broadcasts found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    broadcasts.map((broadcast) => (
                                        <tr key={broadcast.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {broadcast.broadcastCode}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {broadcast.buyerName}
                                            </td>
                                            <td className="max-w-[240px] truncate py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {broadcast.message}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal capitalize text-gray-11">
                                                {broadcast.purpose} · {broadcast.type}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium capitalize ${STATUS_BADGE_STYLES[broadcast.status]}`}
                                                >
                                                    {capitalize(broadcast.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {broadcast.sentTo}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {broadcast.repliedSellers}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {broadcast.createdAt}
                                            </td>
                                            <td className="py-3.5">
                                                <div className="flex items-center justify-center gap-3">
                                                    {broadcast.status === "open" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openConfirmModal(broadcast, "close")}
                                                            aria-label="Close broadcast"
                                                            className="inline-flex cursor-pointer items-center text-gray-8 hover:text-[#946800]"
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openConfirmModal(broadcast, "delete")}
                                                        aria-label="Delete broadcast"
                                                        className="inline-flex cursor-pointer items-center text-gray-8 hover:text-[#E92440]"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && (
                    <Pagination
                        className="container mx-auto px-5 lg:px-10"
                        pageCount={pageCount}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </section>
    );
}

export default AdminBroadcasts;
