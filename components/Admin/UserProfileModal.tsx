"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
    User,
    Store,
    Wrench,
    ClipboardList,
    CalendarCheck,
    MessageCircle,
    Send,
    Inbox,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import ShopDetailModal from "@/components/Admin/ShopDetailModal";
import ServiceDetailModal from "@/components/Admin/ServiceDetailModal";
import ListingDetailModal from "@/components/Admin/ListingDetailModal";
import BookingDetailModal from "@/components/Admin/BookingDetailModal";
import ConversationThreadModal from "@/components/Admin/ConversationThreadModal";
import { useCurrentAdminPermissions, type AdminPage } from "@/custom-hooks/useCurrentAdminPermissions";
import {
    useActivateUserMutation,
    useGetUserDetailQuery,
    useGetUserStatsQuery,
    useGetUserShopsQuery,
    useGetUserListingsQuery,
    useGetUserServicesQuery,
    useGetUserBookingsQuery,
    useGetUserConversationsQuery,
} from "@/store/services/adminService";
import { useDeleteAccountMutation } from "@/store/services/authService";

const RESOURCE_LIST_LIMIT = 5;

type ListQueryArg = { userId: string; page: number; limit: number };
type ListQueryResult = {
    data?: { data?: Record<string, unknown>[]; meta?: { total?: number | string; totalPages?: number | string } };
    isLoading: boolean;
    isFetching: boolean;
};
type UseListQuery = (arg: ListQueryArg) => ListQueryResult;

function toSafeText(value: unknown): string {
    return typeof value === "string" && value.trim() ? value : "-";
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function UserResourceList({
    userId,
    page,
    onPageChange,
    useQuery,
    emptyLabel,
    renderRow,
}: {
    userId: string;
    page: number;
    onPageChange: (page: number) => void;
    useQuery: UseListQuery;
    emptyLabel: string;
    renderRow: (item: Record<string, unknown>) => React.ReactNode;
}) {
    const { data, isLoading, isFetching } = useQuery({ userId, page, limit: RESOURCE_LIST_LIMIT });
    const items = data?.data ?? [];
    const totalPagesRaw = data?.meta?.totalPages;
    const totalPages = Math.max(1, Number(totalPagesRaw) || 1);
    const loading = isLoading || isFetching;

    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="h-10 w-full animate-pulse rounded-[8px] bg-gray-200" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return <p className="py-2 text-center text-[13px] text-gray-11">{emptyLabel}</p>;
    }

    return (
        <div>
            <div className="space-y-2">{items.map(renderRow)}</div>
            {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between text-[12px] text-gray-11">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
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
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="cursor-pointer font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

type ApiUserDetail = {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    roles?: string[];
    isVerified?: boolean;
    isDisabled?: boolean;
    createdAt?: string;
    isOnline?: boolean;
    lastSeenAt?: string | null;
};

type ApiUserStats = {
    shopsCount?: number;
    servicesCount?: number;
    listingsCount?: number;
    bookingsCount?: number;
    conversationsCount?: number;
    messagesSentCount?: number;
    messagesReceivedCount?: number;
};

type StatTile = {
    label: string;
    value: string;
    icon: typeof Store;
    bg: string;
    color: string;
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatDateTime(date: Date) {
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type UserProfileModalProps = {
    userId: string | null;
    onClose: () => void;
};

function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmModalRef = useRef<HTMLDivElement>(null);
    const expandedPanelRef = useRef<HTMLDivElement>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const { data, isLoading, isFetching, refetch } = useGetUserDetailQuery(userId ?? "", {
        skip: !userId,
    });
    const user = (data as { data?: ApiUserDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const { data: statsData, isLoading: isStatsLoading } = useGetUserStatsQuery(userId ?? "", {
        skip: !userId,
    });
    const stats = (statsData as { data?: ApiUserStats } | undefined)?.data;
    const statsLoading = isStatsLoading;

    const plainTiles: StatTile[] = [
        {
            label: "Conversations",
            value: statsLoading ? "..." : String(stats?.conversationsCount ?? 0),
            icon: MessageCircle,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
        },
        {
            label: "Messages Sent",
            value: statsLoading ? "..." : String(stats?.messagesSentCount ?? 0),
            icon: Send,
            bg: "bg-green-4",
            color: "text-green-1",
        },
        {
            label: "Messages Received",
            value: statsLoading ? "..." : String(stats?.messagesReceivedCount ?? 0),
            icon: Inbox,
            bg: "bg-[#FDD5D5]",
            color: "text-[#E92440]",
        },
    ];

    const { isSuperAdmin, has } = useCurrentAdminPermissions();
    const [expandedTile, setExpandedTile] = useState<
        "shops" | "services" | "listings" | "bookings" | "conversations" | null
    >(null);
    const [listPage, setListPage] = useState(1);
    const [viewingShopId, setViewingShopId] = useState<string | null>(null);
    const [viewingServiceId, setViewingServiceId] = useState<string | null>(null);
    const [viewingProductId, setViewingProductId] = useState<string | null>(null);
    const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);
    const [viewingConversation, setViewingConversation] = useState<
        { id: string; otherPartyName?: string } | null
    >(null);

    // Reset whenever a (possibly different) user is opened, so stale
    // state/query cache from a previous user never flashes on reopen.
    useEffect(() => {
        setExpandedTile(null);
        setListPage(1);
        setViewingShopId(null);
        setViewingServiceId(null);
        setViewingProductId(null);
        setViewingRequestId(null);
        setViewingConversation(null);
    }, [userId]);

    function toggleExpanded(key: "shops" | "services" | "listings" | "bookings" | "conversations") {
        setExpandedTile((prev) => (prev === key ? null : key));
        setListPage(1);
    }

    // The expanded panel renders below content that can already fill the
    // modal, and this modal's scrollbar is hidden — without this, opening a
    // tile can look like nothing happened unless the admin manually scrolls.
    useEffect(() => {
        if (!expandedTile) return;
        const id = requestAnimationFrame(() => {
            expandedPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        return () => cancelAnimationFrame(id);
    }, [expandedTile]);

    const expandableTiles: {
        key: "shops" | "services" | "listings" | "bookings";
        label: string;
        value: string;
        icon: typeof Store;
        bg: string;
        color: string;
        permission: AdminPage;
    }[] = [
        {
            key: "shops",
            label: "Shops",
            value: statsLoading ? "..." : String(stats?.shopsCount ?? 0),
            icon: Store,
            bg: "bg-green-4",
            color: "text-green-1",
            permission: "shops",
        },
        {
            key: "services",
            label: "Services",
            value: statsLoading ? "..." : String(stats?.servicesCount ?? 0),
            icon: Wrench,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            permission: "services",
        },
        {
            key: "listings",
            label: "Listings",
            value: statsLoading ? "..." : String(stats?.listingsCount ?? 0),
            icon: ClipboardList,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
            permission: "listings",
        },
        {
            key: "bookings",
            label: "Bookings",
            value: statsLoading ? "..." : String(stats?.bookingsCount ?? 0),
            icon: CalendarCheck,
            bg: "bg-[#FDE9DF]",
            color: "text-orange",
            permission: "bookings",
        },
    ];

    const [activateUser] = useActivateUserMutation();
    const [deleteAccount] = useDeleteAccountMutation();

    const isOpen = Boolean(userId);
    const isActive = !user?.isDisabled;
    const pendingAction = isActive ? "deactivate" : "activate";

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    async function handleConfirmStatusChange() {
        if (!user) return;
        const id = user._id ?? user.id ?? "";

        setIsUpdating(true);
        try {
            const response =
                pendingAction === "activate"
                    ? await activateUser({ id }).unwrap()
                    : await deleteAccount({ id }).unwrap();

            toast.success(response.message);
            setIsStatusModalOpen(false);
            refetch();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        } finally {
            setIsUpdating(false);
        }
    }

    const joinDate = user?.createdAt
        ? new Date(user.createdAt).toISOString().slice(0, 10)
        : "-";
    const isOnline = Boolean(user?.isOnline);
    const lastSeenLabel = isOnline
        ? "-"
        : user?.lastSeenAt
            ? formatDateTime(new Date(user.lastSeenAt))
            : "Never";

    return (
        <>
            <Modal
                editModalRef={modalRef}
                open={isOpen}
                setOpen={handleSetOpen}
                centered
                disableOutsideClick={Boolean(
                    viewingShopId || viewingServiceId || viewingProductId || viewingRequestId || viewingConversation,
                )}
            >
                <div className="flex max-h-[90vh] w-[92vw] max-w-[500px] flex-col rounded-[12px] bg-white shadow-xl">
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <User className="h-5 w-5 text-green-1" strokeWidth={2} />
                            User Profile
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
                    ) : !user ? (
                        <p className="text-[14px] text-gray-11">User not found.</p>
                    ) : (
                        <>
                            <div className="flex items-center gap-4 rounded-[10px] bg-gray-10 p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB] text-[16px] font-semibold text-[#030303]">
                                    {getInitials(user.name ?? "-")}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[16px] font-semibold text-[#001907]">
                                        {user.name ?? "-"}
                                    </p>
                                    <p className="truncate text-[13px] text-gray-11">{user.email ?? "-"}</p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Phone
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">{user.phone ?? "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Address
                                    </p>
                                    <p className="mt-1 truncate text-[14px] text-[#001907]">
                                        {user.address ?? "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Role
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <span
                                                    key={role}
                                                    className="rounded-[6px] bg-green-4 px-2 py-0.5 text-[12px] font-medium capitalize text-green-1"
                                                >
                                                    {role}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[14px] text-[#001907]">-</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Verified
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {user.isVerified ? "Yes" : "No"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Joined
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">{joinDate}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between rounded-[10px] border border-gray-9 px-4 py-3">
                                <span className="text-[13px] font-medium text-gray-8">
                                    Account Status
                                </span>
                                <div className="flex items-center gap-2.5">
                                    <ToggleSwitch
                                        checked={isActive}
                                        ariaLabel={isActive ? "Deactivate user" : "Activate user"}
                                        onChange={() => setIsStatusModalOpen(true)}
                                    />
                                    <span className="text-[13px] text-gray-11">
                                        {isActive ? "Active" : "In active"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-[10px] border border-gray-9 px-4 py-3">
                                <span className="text-[13px] font-medium text-gray-8">
                                    Online Status
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`inline-flex h-2 w-2 shrink-0 rounded-full ${
                                            isOnline ? "bg-green-1" : "bg-gray-9"
                                        }`}
                                    />
                                    <span className="text-[13px] font-normal text-gray-11">
                                        {isOnline ? "Online" : `Last seen: ${lastSeenLabel}`}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <p className="mb-3 text-[13px] font-medium text-gray-8">
                                    Activity
                                </p>
                                <div className="space-y-2">
                                    {expandableTiles.map((tile) => {
                                        const Icon = tile.icon;
                                        const canExpand = isSuperAdmin || has(tile.permission);
                                        const isExpanded = expandedTile === tile.key;
                                        const userIdValue = user._id ?? user.id ?? "";

                                        return (
                                            <div key={tile.key} className="rounded-[10px] border border-gray-9">
                                                <button
                                                    type="button"
                                                    onClick={() => canExpand && toggleExpanded(tile.key)}
                                                    disabled={!canExpand}
                                                    className="flex w-full cursor-pointer items-center gap-3 p-3 text-left disabled:cursor-not-allowed"
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${tile.bg}`}
                                                    >
                                                        <Icon className={`h-4 w-4 ${tile.color}`} strokeWidth={2} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[12px] text-gray-11">
                                                            {tile.label}
                                                        </p>
                                                        <p className="text-[15px] font-semibold text-[#001907]">
                                                            {tile.value}
                                                        </p>
                                                    </div>
                                                    {canExpand &&
                                                        (isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 shrink-0 text-gray-11" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-11" />
                                                        ))}
                                                </button>

                                                {isExpanded && (
                                                    <div ref={expandedPanelRef} className="border-t border-gray-9 p-3">
                                                        {tile.key === "shops" && (
                                                            <UserResourceList
                                                                userId={userIdValue}
                                                                page={listPage}
                                                                onPageChange={setListPage}
                                                                useQuery={useGetUserShopsQuery}
                                                                emptyLabel="No shops yet"
                                                                renderRow={(item) => (
                                                                    <button
                                                                        key={String(item._id)}
                                                                        type="button"
                                                                        onClick={() => setViewingShopId(String(item._id))}
                                                                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-left hover:border-green-1"
                                                                    >
                                                                        <span className="truncate text-[13px] font-medium text-[#001907]">
                                                                            {toSafeText(item.title)}
                                                                        </span>
                                                                        <span className={`shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${item.isDisabled ? "bg-[#FDD5D5] text-[#C23652]" : "bg-green-4 text-green-1"}`}>
                                                                            {item.isDisabled ? "Inactive" : "Active"}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            />
                                                        )}
                                                        {tile.key === "services" && (
                                                            <UserResourceList
                                                                userId={userIdValue}
                                                                page={listPage}
                                                                onPageChange={setListPage}
                                                                useQuery={useGetUserServicesQuery}
                                                                emptyLabel="No services yet"
                                                                renderRow={(item) => (
                                                                    <button
                                                                        key={String(item._id)}
                                                                        type="button"
                                                                        onClick={() => setViewingServiceId(String(item._id))}
                                                                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-left hover:border-green-1"
                                                                    >
                                                                        <span className="truncate text-[13px] font-medium text-[#001907]">
                                                                            {toSafeText(item.title)}
                                                                        </span>
                                                                        <span className={`shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${item.isDisabled ? "bg-[#FDD5D5] text-[#C23652]" : "bg-green-4 text-green-1"}`}>
                                                                            {item.isDisabled ? "Inactive" : "Active"}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            />
                                                        )}
                                                        {tile.key === "listings" && (
                                                            <UserResourceList
                                                                userId={userIdValue}
                                                                page={listPage}
                                                                onPageChange={setListPage}
                                                                useQuery={useGetUserListingsQuery}
                                                                emptyLabel="No listings yet"
                                                                renderRow={(item) => (
                                                                    <button
                                                                        key={String(item._id)}
                                                                        type="button"
                                                                        onClick={() => setViewingProductId(String(item._id))}
                                                                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-left hover:border-green-1"
                                                                    >
                                                                        <span className="truncate text-[13px] font-medium text-[#001907]">
                                                                            {toSafeText(item.title)}
                                                                        </span>
                                                                        <span className={`shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${item.isDisabled ? "bg-[#FDD5D5] text-[#C23652]" : "bg-green-4 text-green-1"}`}>
                                                                            {item.isDisabled ? "Inactive" : "Active"}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            />
                                                        )}
                                                        {tile.key === "bookings" && (
                                                            <UserResourceList
                                                                userId={userIdValue}
                                                                page={listPage}
                                                                onPageChange={setListPage}
                                                                useQuery={useGetUserBookingsQuery}
                                                                emptyLabel="No bookings yet"
                                                                renderRow={(item) => {
                                                                    const service = item.service as { title?: string } | undefined;
                                                                    const status = typeof item.status === "string" ? item.status : "pending";
                                                                    return (
                                                                        <button
                                                                            key={String(item._id)}
                                                                            type="button"
                                                                            onClick={() => setViewingRequestId(String(item._id))}
                                                                            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-left hover:border-green-1"
                                                                        >
                                                                            <span className="truncate text-[13px] font-medium text-[#001907]">
                                                                                {toSafeText(service?.title)}
                                                                            </span>
                                                                            <span className="shrink-0 rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[11px] font-medium text-gray-8">
                                                                                {capitalize(status)}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {plainTiles.map((stat) => {
                                        const Icon = stat.icon;
                                        const isExpanded = expandedTile === "conversations";
                                        return (
                                            <button
                                                key={stat.label}
                                                type="button"
                                                onClick={() => toggleExpanded("conversations")}
                                                className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-gray-9 p-3 text-left"
                                            >
                                                <span
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${stat.bg}`}
                                                >
                                                    <Icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[12px] text-gray-11">
                                                        {stat.label}
                                                    </p>
                                                    <p className="text-[15px] font-semibold text-[#001907]">
                                                        {stat.value}
                                                    </p>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-11" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-11" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {expandedTile === "conversations" && (
                                    <div ref={expandedPanelRef} className="mt-2 rounded-[10px] border border-gray-9 p-3">
                                            <UserResourceList
                                                userId={user._id ?? user.id ?? ""}
                                                page={listPage}
                                                onPageChange={setListPage}
                                                useQuery={useGetUserConversationsQuery}
                                                emptyLabel="No conversations yet"
                                                renderRow={(item) => {
                                                    const userIdValue = user._id ?? user.id ?? "";
                                                    const buyer = item.buyer as
                                                        | { _id?: string; name?: string }
                                                        | undefined;
                                                    const seller = item.seller as
                                                        | { _id?: string; name?: string }
                                                        | undefined;
                                                    const otherParty = buyer?._id === userIdValue ? seller : buyer;
                                                    const latestMessage = item.latestMessage as
                                                        | { text?: string }
                                                        | undefined;
                                                    return (
                                                        <button
                                                            key={String(item._id)}
                                                            type="button"
                                                            onClick={() =>
                                                                setViewingConversation({
                                                                    id: String(item._id),
                                                                    otherPartyName: otherParty?.name,
                                                                })
                                                            }
                                                            className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-[8px] border border-gray-9 px-3 py-2 text-left hover:border-green-1"
                                                        >
                                                            <span className="truncate text-[13px] font-medium text-[#001907]">
                                                                {toSafeText(otherParty?.name)}
                                                            </span>
                                                            {latestMessage?.text && (
                                                                <span className="truncate text-[11px] text-gray-11">
                                                                    {latestMessage.text}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                }}
                                            />
                                    </div>
                                )}
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

            <Modal
                editModalRef={confirmModalRef}
                open={isStatusModalOpen}
                setOpen={setIsStatusModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingAction === "activate" ? "Activate user" : "Deactivate user"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to {pendingAction}{" "}
                        <span className="font-medium text-[#001907]">{user?.name}</span>?
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsStatusModalOpen(false)}
                            disabled={isUpdating}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <DoodleButton
                            type="button"
                            disabled={isUpdating}
                            onClick={handleConfirmStatusChange}
                            className={`h-[40px] flex-1 cursor-pointer rounded-[8px] border text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${pendingAction === "activate"
                                ? "border-green-1 bg-green-1"
                                : "border-[#E92440] bg-[#E92440]"
                                }`}
                        >
                            {isUpdating ? <BeatLoader color="white" size={8} /> : "Confirm"}
                        </DoodleButton>
                    </div>
                </div>
            </Modal>

            <ShopDetailModal shopId={viewingShopId} onClose={() => setViewingShopId(null)} />
            <ServiceDetailModal serviceId={viewingServiceId} onClose={() => setViewingServiceId(null)} />
            <ListingDetailModal productId={viewingProductId} onClose={() => setViewingProductId(null)} />
            <BookingDetailModal requestId={viewingRequestId} onClose={() => setViewingRequestId(null)} />
            <ConversationThreadModal
                open={Boolean(viewingConversation)}
                conversationId={viewingConversation?.id}
                userId={user?._id ?? user?.id}
                userName={user?.name}
                otherPartyName={viewingConversation?.otherPartyName}
                onClose={() => setViewingConversation(null)}
            />
        </>
    );
}

export default UserProfileModal;
