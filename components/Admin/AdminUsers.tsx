"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import {
    useActivateUserMutation,

    useGetAllUsersFromAdminQuery,
} from "@/store/services/adminService";
import { useDeleteAccountMutation } from "@/store/services/authService";
import { parsePositiveInt } from "@/components/Updates/Notifications";

type UserStatus = "active" | "inactive" | "deleted";

type AdminUser = {
    id: string;
    name: string;
    email: string;
    joinDate: string;
    status: UserStatus;
};

type ApiAdminUser = {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    createdAt?: string;
    isDisabled?: boolean;
};

type AdminUsersResponse = {
    data?: ApiAdminUser[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

const PAGE_LIMIT = 10;

const STATUS_STYLES: Record<UserStatus, { label: string; className: string }> = {
    active: {
        label: "Active",
        className: "bg-[#CEF4CF] text-[#0F172A]",
    },
    inactive: {
        label: "In active",
        className: "bg-[#FDEAB8] text-[#0F172A]",
    },
    deleted: {
        label: "Deleted",
        className: "bg-[#FDD5D5] text-[#0F172A]",
    },
};

function mapUserStatus(user: ApiAdminUser): UserStatus {

    if (user.isDisabled) {
        return "inactive";
    }

    return "active";
}

function mapApiUser(user: ApiAdminUser): AdminUser {
    const joinDate = user.createdAt
        ? new Date(user.createdAt).toISOString().slice(0, 10)
        : "-";

    return {
        id: user._id ?? user.id ?? "",
        name: user.name ?? "-",
        email: user.email ?? "-",
        joinDate,
        status: mapUserStatus(user),
    };
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function UserActionButton({
    user,
    isUpdating,
    onClick,
}: {
    user: AdminUser;
    isUpdating: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={isUpdating}
            onClick={onClick}
            className={`inline-flex cursor-pointer min-w-[96px] items-center justify-center rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${user.status === "active"
                ? "border-[#FDEAB8] text-[#0F172A] hover:bg-[#FDEAB8]"
                : "border-green-1 text-green-1 hover:bg-green-1 hover:text-white"
                }`}
        >
            {isUpdating ? (
                <BeatLoader
                    size={6}
                    color={user.status === "active" ? "#0F172A" : "#2D9B9B"}
                />
            ) : user.status === "active" ? (
                "Deactivate"
            ) : (
                "Activate"
            )}
        </button>
    );
}

type PendingStatusChange = {
    user: AdminUser;
    action: "activate" | "deactivate";
};

function AdminUsers() {
    const [page, setPage] = useState(1);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const statusModalRef = useRef<HTMLDivElement>(null);

    const {
        data: usersResponse,
        isLoading,
        isFetching,
    } = useGetAllUsersFromAdminQuery({ page, limit: PAGE_LIMIT });

    const [activateUser] = useActivateUserMutation();
    const [deleteAccount] = useDeleteAccountMutation();
    const users = useMemo(() => {
        const response = usersResponse as AdminUsersResponse | undefined;
        return (response?.data ?? []).map(mapApiUser);
    }, [usersResponse]);

    const totalUsers =
        parsePositiveInt((usersResponse as AdminUsersResponse | undefined)?.meta?.total) ??
        users.length;

    const pageCount =
        parsePositiveInt((usersResponse as AdminUsersResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalUsers / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    async function handleStatusChange(user: AdminUser, action: "activate" | "deactivate") {
        setUpdatingUserId(user.id);

        try {
            const response =
                action === "activate"
                    ? await activateUser({ id: user.id }).unwrap()
                    : await deleteAccount({ id: user.id }).unwrap();

            toast.success(response.message);

            setIsStatusModalOpen(false);
            setPendingStatusChange(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        } finally {
            setUpdatingUserId(null);
        }
    }

    function openStatusModal(user: AdminUser) {
        setPendingStatusChange({
            user,
            action: user.status === "active" ? "deactivate" : "activate",
        });
        setIsStatusModalOpen(true);
    }

    function closeStatusModal() {
        if (updatingUserId) return;
        setIsStatusModalOpen(false);
        setPendingStatusChange(null);
    }

    useEffect(() => {
        if (!isStatusModalOpen && !updatingUserId) {
            setPendingStatusChange(null);
        }
    }, [isStatusModalOpen, updatingUserId]);

    return (
        <section className="  ">
            <Modal
                editModalRef={statusModalRef}
                open={isStatusModalOpen}
                setOpen={setIsStatusModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingStatusChange?.action === "activate" ? "Activate user" : "Deactivate user"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to {pendingStatusChange?.action === "activate" ? "activate" : "deactivate"}{" "}
                        <span className="font-medium text-[#001907]">
                            {pendingStatusChange?.user.name}
                        </span>
                        ?
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeStatusModal}
                            disabled={Boolean(updatingUserId)}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        {pendingStatusChange?.action === "activate" ? (
                            <DoodleButton
                                type="button"
                                disabled={Boolean(updatingUserId)}
                                onClick={() => {
                                    if (!pendingStatusChange) return;
                                    handleStatusChange(
                                        pendingStatusChange.user,
                                        pendingStatusChange.action,
                                    );
                                }}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updatingUserId ? (
                                    <BeatLoader color="white" size={8} />
                                ) : (
                                    "Confirm"
                                )}
                            </DoodleButton>
                        ) : (
                            <button
                                type="button"
                                disabled={Boolean(updatingUserId)}
                                onClick={() => {
                                    if (!pendingStatusChange) return;
                                    handleStatusChange(
                                        pendingStatusChange.user,
                                        pendingStatusChange.action,
                                    );
                                }}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updatingUserId ? (
                                    <BeatLoader color="white" size={8} />
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className=" container mx-auto px-5 lg:px-10 ">
                    <h1 className="text-[24px] font-semibold text-[#001907] sm:text-[28px]">
                        {loading ? "..." : `${totalUsers} Users`}
                    </h1>

                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4 ">
                    <div className="overflow-x-auto">
                        <table className="min-w-[760px] w-full">
                            <thead className="   ">
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        <button type="button" className="inline-flex items-center gap-1">
                                            Name
                                            <ChevronsUpDown className="h-4 w-4 text-gray-11" />
                                        </button>
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Email
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Join Date
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
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
                                            {Array.from({ length: 5 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No users found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    users.map((user) => {
                                        const statusStyle = STATUS_STYLES[user.status];

                                        return (
                                            <tr key={user.id} className="bg-white">
                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB] text-[11px] font-medium text-[#030303]">
                                                            {getInitials(user.name)}
                                                        </div>
                                                        <span className="whitespace-nowrap first-letter:capitalize  text-[14px] font-normal text-[#001907]">
                                                            {user.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {user.email}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {user.joinDate}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${statusStyle.className}`}
                                                    >
                                                        {statusStyle.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <UserActionButton
                                                        user={user}
                                                        isUpdating={updatingUserId === user.id}
                                                        onClick={() => openStatusModal(user)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && (
                    <Pagination
                        className="container mx-auto px-5 lg:px-10 "
                        pageCount={pageCount}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                )}
            </div>



        </section>
    );
}

export default AdminUsers;
