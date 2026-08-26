"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronsUpDown, Download, Eye, Pencil, Wifi, X } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import UserProfileModal from "@/components/Admin/UserProfileModal";
import {
    useActivateUserMutation,
    useUpdateUserRoleMutation,
    useGetAllUsersFromAdminQuery,
    useLazyGetAllUsersFromAdminQuery,
} from "@/store/services/adminService";
import { useDeleteAccountMutation } from "@/store/services/authService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import { downloadCsv, csvText } from "@/utils/downloadCsv";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import searchIcon from "@/assets/icons/searchIcon.svg";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";

const SEARCH_DEBOUNCE_MS = 400;

type UserStatus = "active" | "inactive" | "deleted";
type UserRole = "buyer" | "seller";
type PresenceStatus = "online" | "offline";

type AdminUser = {
    id: string;
    userCode: string;
    name: string;
    email: string;
    phone: string;
    joinDate: string;
    status: UserStatus;
    role: UserRole;
    presence: PresenceStatus;
    lastSeenLabel: string;
};

type ApiAdminUser = {
    _id?: string;
    id?: string;
    userCode?: string;
    name?: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    isDisabled?: boolean;
    roles?: string[];
    isOnline?: boolean;
    lastSeenAt?: string | null;
};

type AdminUsersResponse = {
    data?: ApiAdminUser[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

const PAGE_LIMIT = 50;

const STATUS_LABELS: Record<UserStatus, string> = {
    active: "Active",
    inactive: "In active",
    deleted: "Deleted",
};

const ROLE_LABELS: Record<UserRole, string> = {
    buyer: "Buyer",
    seller: "Seller",
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: "buyer", label: "Buyer" },
    { value: "seller", label: "Seller" },
];

function mapUserStatus(user: ApiAdminUser): UserStatus {

    if (user.isDisabled) {
        return "inactive";
    }

    return "active";
}

function mapUserRole(user: ApiAdminUser): UserRole {
    return user.roles?.includes("seller") ? "seller" : "buyer";
}

function formatDateTime(date: Date) {
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function mapApiUser(user: ApiAdminUser): AdminUser {
    const joinDate = user.createdAt
        ? new Date(user.createdAt).toISOString().slice(0, 10)
        : "-";
    const isOnline = Boolean(user.isOnline);
    const lastSeenLabel = isOnline
        ? "-"
        : user.lastSeenAt
            ? formatDateTime(new Date(user.lastSeenAt))
            : "Never";

    return {
        id: user._id ?? user.id ?? "",
        userCode: user.userCode ?? "-",
        name: user.name ?? "-",
        email: user.email ?? "-",
        phone: user.phone ?? "-",
        joinDate,
        status: mapUserStatus(user),
        role: mapUserRole(user),
        presence: isOnline ? "online" : "offline",
        lastSeenLabel,
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

type PendingStatusChange = {
    user: AdminUser;
    action: "activate" | "deactivate";
};

function AdminUsers() {
    const { canEdit, canDelete } = useCurrentAdminPermissions();
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleChangeUser, setRoleChangeUser] = useState<AdminUser | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>("buyer");
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const statusModalRef = useRef<HTMLDivElement>(null);
    const roleModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const linkedUserId = params.get("viewUserId");
        if (linkedUserId) {
            setViewingUserId(linkedUserId);
        }
        if (params.get("online") === "1" || params.get("online") === "true") {
            setOnlineOnly(true);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [dateFilter, customStartDate, customEndDate, onlineOnly]);

    const { startDate, endDate } = getDateRangeForFilter(
        dateFilter,
        customStartDate,
        customEndDate,
    );

    const {
        data: usersResponse,
        isLoading,
        isFetching,
    } = useGetAllUsersFromAdminQuery(
        { page, limit: PAGE_LIMIT, search, startDate, endDate, online: onlineOnly },
        { pollingInterval: 25000 },
    );

    const [activateUser] = useActivateUserMutation();
    const [deleteAccount] = useDeleteAccountMutation();
    const [updateUserRole] = useUpdateUserRoleMutation();
    const [triggerExport, { isFetching: isExporting }] = useLazyGetAllUsersFromAdminQuery();
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

    function openRoleModal(user: AdminUser) {
        setRoleChangeUser(user);
        setSelectedRole(user.role);
        setIsRoleModalOpen(true);
    }

    function closeRoleModal() {
        if (isUpdatingRole) return;
        setIsRoleModalOpen(false);
        setRoleChangeUser(null);
    }

    async function handleRoleChange() {
        if (!roleChangeUser) return;
        setIsUpdatingRole(true);

        try {
            const response = await updateUserRole({
                id: roleChangeUser.id,
                roles: [selectedRole],
            }).unwrap();
            toast.success((response as { message?: string })?.message ?? "User role updated successfully");
            setIsRoleModalOpen(false);
            setRoleChangeUser(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        } finally {
            setIsUpdatingRole(false);
        }
    }

    async function handleExportCsv() {
        try {
            const response = await triggerExport({
                page: 1,
                limit: totalUsers > 0 ? totalUsers : 100000,
                search,
                startDate,
                endDate,
                online: onlineOnly,
            }).unwrap();
            const rows = ((response as AdminUsersResponse)?.data ?? []).map(mapApiUser);
            if (rows.length === 0) {
                toast.error("No users to export");
                return;
            }
            downloadCsv(
                `users-${new Date().toISOString().slice(0, 10)}.csv`,
                ["User ID", "Name", "Email", "Phone", "Join Date", "Status", "Role"],
                rows.map((user) => [
                    user.userCode,
                    user.name,
                    user.email,
                    csvText(user.phone),
                    csvText(user.joinDate),
                    STATUS_LABELS[user.status],
                    ROLE_LABELS[user.role],
                ]),
            );
        } catch {
            toast.error("Failed to export users");
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
            <UserProfileModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />

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

            <Modal
                editModalRef={roleModalRef}
                open={isRoleModalOpen}
                setOpen={(value) => {
                    const nextOpen = typeof value === "function" ? value(isRoleModalOpen) : value;
                    if (!nextOpen) closeRoleModal();
                }}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">Change user role</h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Update the role for{" "}
                        <span className="font-medium text-[#001907]">{roleChangeUser?.name}</span>.
                    </p>
                    <div className="mt-4 space-y-2.5">
                        {ROLE_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                htmlFor={`user-role-${option.value}`}
                                className="flex cursor-pointer items-center gap-3 text-[14px] text-[#001907]"
                            >
                                <input
                                    id={`user-role-${option.value}`}
                                    type="radio"
                                    name="user-role"
                                    checked={selectedRole === option.value}
                                    onChange={() => setSelectedRole(option.value)}
                                    className="h-4 w-4 cursor-pointer accent-green-1"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                    <p className="mt-4 text-[12px] text-gray-11">
                        Need to grant admin access instead? That&apos;s managed separately from the{" "}
                        <Link href="/admin/admins" className="font-medium text-green-1 hover:underline">
                            Admins page
                        </Link>
                        .
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeRoleModal}
                            disabled={isUpdatingRole}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <DoodleButton
                            type="button"
                            disabled={isUpdatingRole}
                            onClick={handleRoleChange}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isUpdatingRole ? <BeatLoader color="white" size={8} /> : "Confirm"}
                        </DoodleButton>
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        User Management
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage your platform users and their access
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
                            placeholder="Search by name, email, phone, or ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <DateRangeFilter
                            value={dateFilter}
                            onChange={setDateFilter}
                            startDate={customStartDate}
                            endDate={customEndDate}
                            onStartDateChange={setCustomStartDate}
                            onEndDateChange={setCustomEndDate}
                        />

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={isExporting}
                            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 bg-white px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isExporting ? (
                                <BeatLoader size={6} color="#007781" />
                            ) : (
                                <>
                                    <Download className="h-4 w-4" strokeWidth={2} />
                                    Export CSV
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {onlineOnly && (
                    <div className="container mx-auto mt-3 px-5 lg:px-10">
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-4 py-1.5 pl-3 pr-2 text-[13px] font-medium text-green-1">
                            <Wifi className="h-3.5 w-3.5" strokeWidth={2} />
                            Showing online users only
                            <button
                                type="button"
                                onClick={() => setOnlineOnly(false)}
                                aria-label="Clear online filter"
                                className="cursor-pointer rounded-full p-0.5 hover:bg-white/60"
                            >
                                <X className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4 ">
                    <div className="overflow-x-auto">
                        <table className="min-w-[880px] w-full">
                            <thead className="   ">
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        User ID
                                    </th>
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
                                        Phone
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Join Date
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Online Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Role
                                    </th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Profile
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 9 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && users.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No users found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    users.map((user) => {
                                        const isUpdating = updatingUserId === user.id;

                                        return (
                                            <tr key={user.id} className="bg-white">
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {user.userCode}
                                                </td>
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
                                                    {user.phone}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {user.joinDate}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <ToggleSwitch
                                                            checked={user.status === "active"}
                                                            disabled={
                                                                isUpdating ||
                                                                (user.status === "active"
                                                                    ? !canDelete("users")
                                                                    : !canEdit("users"))
                                                            }
                                                            ariaLabel={
                                                                user.status === "active"
                                                                    ? `Deactivate ${user.name}`
                                                                    : `Activate ${user.name}`
                                                            }
                                                            onChange={() => openStatusModal(user)}
                                                        />
                                                        {isUpdating ? (
                                                            <BeatLoader size={6} color="#007781" />
                                                        ) : (
                                                            <span className="whitespace-nowrap text-[13px] font-normal text-gray-11">
                                                                {STATUS_LABELS[user.status]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`inline-flex h-2 w-2 shrink-0 rounded-full ${
                                                                user.presence === "online"
                                                                    ? "bg-green-1"
                                                                    : "bg-gray-9"
                                                            }`}
                                                        />
                                                        <span className="text-[13px] font-normal text-gray-11">
                                                            {user.presence === "online"
                                                                ? "Online"
                                                                : `Last seen: ${user.lastSeenLabel}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="rounded-[4px] bg-gray-10 px-2 py-0.5 text-[12px] font-medium text-gray-8">
                                                            {ROLE_LABELS[user.role]}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => openRoleModal(user)}
                                                            disabled={!canEdit("users")}
                                                            aria-label={`Change role for ${user.name}`}
                                                            className="inline-flex h-6 w-6 cursor-pointer items-center justify-center text-gray-11 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingUserId(user.id)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </button>
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
