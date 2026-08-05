"use client";

import { useRef, useState } from "react";
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
} from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import {
    useActivateUserMutation,
    useGetUserDetailQuery,
    useGetUserStatsQuery,
} from "@/store/services/adminService";
import { useDeleteAccountMutation } from "@/store/services/authService";

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

type UserProfileModalProps = {
    userId: string | null;
    onClose: () => void;
};

function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmModalRef = useRef<HTMLDivElement>(null);
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

    const statTiles: StatTile[] = [
        {
            label: "Shops",
            value: statsLoading ? "..." : String(stats?.shopsCount ?? 0),
            icon: Store,
            bg: "bg-green-4",
            color: "text-green-1",
        },
        {
            label: "Services",
            value: statsLoading ? "..." : String(stats?.servicesCount ?? 0),
            icon: Wrench,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
        },
        {
            label: "Listings",
            value: statsLoading ? "..." : String(stats?.listingsCount ?? 0),
            icon: ClipboardList,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
        },
        {
            label: "Bookings",
            value: statsLoading ? "..." : String(stats?.bookingsCount ?? 0),
            icon: CalendarCheck,
            bg: "bg-[#FDE9DF]",
            color: "text-orange",
        },
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

    return (
        <>
            <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
                <div className="flex max-h-[85vh] w-[92vw] max-w-[440px] flex-col rounded-[12px] bg-white shadow-xl">
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

                            <div className="mt-6">
                                <p className="mb-3 text-[13px] font-medium text-gray-8">
                                    Activity
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {statTiles.map((stat) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div
                                                key={stat.label}
                                                className="flex items-center gap-3 rounded-[10px] border border-gray-9 p-3"
                                            >
                                                <span
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${stat.bg}`}
                                                >
                                                    <Icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[12px] text-gray-11">
                                                        {stat.label}
                                                    </p>
                                                    <p className="text-[15px] font-semibold text-[#001907]">
                                                        {stat.value}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
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
        </>
    );
}

export default UserProfileModal;
