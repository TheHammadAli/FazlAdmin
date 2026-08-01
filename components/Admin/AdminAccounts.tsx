"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Copy, KeyRound, Pencil, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import {
    useGetAllAdminAccountsQuery,
    useCreateAdminAccountMutation,
    useUpdateAdminAccountMutation,
    useDisableAdminAccountMutation,
    useEnableAdminAccountMutation,
    useResetAdminPasswordMutation,
    useGetUserDetailQuery,
} from "@/store/services/adminService";
import { useAppSelector } from "@/store/store";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import searchIcon from "@/assets/icons/searchIcon.svg";
import Image from "next/image";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type AdminRole = "super_admin" | "admin" | "moderator";

// Super Admin is a single, fixed account and is never assignable from this UI.
const ROLE_OPTIONS: { value: Exclude<AdminRole, "super_admin">; label: string }[] = [
    { value: "admin", label: "Admin" },
    { value: "moderator", label: "Moderator" },
];

type AdminPermission =
    | "users"
    | "shops"
    | "listings"
    | "services"
    | "categories"
    | "bookings"
    | "broadcasts"
    | "feed"
    | "reports"
    | "email-logs"
    | "settings";

const PERMISSION_OPTIONS: { value: AdminPermission; label: string }[] = [
    { value: "users", label: "Users" },
    { value: "shops", label: "Shops" },
    { value: "listings", label: "Listings" },
    { value: "services", label: "Services" },
    { value: "categories", label: "Categories" },
    { value: "bookings", label: "Service Bookings" },
    { value: "broadcasts", label: "Echo Broadcasts" },
    { value: "feed", label: "Feed" },
    { value: "reports", label: "Reports" },
    { value: "email-logs", label: "Email Logs" },
    { value: "settings", label: "Settings" },
];

const ROLE_LABELS: Record<AdminRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
};

const ROLE_BADGE_STYLES: Record<AdminRole, string> = {
    super_admin: "bg-[#FDEAB8] text-[#946200]",
    admin: "bg-green-4 text-green-1",
    moderator: "bg-[#E7F0FF] text-[#2F6FE4]",
};

type AdminAccount = {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermission[];
    isDisabled: boolean;
    createdAt: string;
};

type ApiAdminAccount = {
    _id?: string;
    name?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    isDisabled?: boolean;
    createdAt?: string;
};

type AdminAccountsResponse = {
    data?: ApiAdminAccount[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function toAdminRole(roles?: string[]): AdminRole {
    if (roles?.includes("super_admin")) return "super_admin";
    if (roles?.includes("moderator")) return "moderator";
    return "admin";
}

/** Client-side suggestion only — the actual value stored is whatever's in the field on submit. */
function generateSuggestedPassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (value) => chars[value % chars.length]).join("");
}

function mapApiAdminAccount(account: ApiAdminAccount): AdminAccount {
    return {
        id: account._id ?? "",
        name: account.name ?? "-",
        email: account.email ?? "-",
        role: toAdminRole(account.roles),
        permissions: (account.permissions ?? []) as AdminPermission[],
        isDisabled: account.isDisabled ?? false,
        createdAt: formatDate(account.createdAt),
    };
}

type FormState = {
    name: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermission[];
};

const EMPTY_FORM: FormState = { name: "", email: "", role: "admin", permissions: [] };

type PendingStatusChange = {
    admin: AdminAccount;
    action: "disable" | "enable";
};

function AdminAccounts() {
    const currentUserId = useAppSelector((state) => state.authReducer.userId);
    const { data: currentUserData, isLoading: isCurrentUserLoading } = useGetUserDetailQuery(
        currentUserId,
        { skip: !currentUserId },
    );
    const currentUserRoles =
        (currentUserData as { data?: { roles?: string[] } } | undefined)?.data?.roles ?? [];
    const isSuperAdmin = currentUserRoles.includes("super_admin");

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordModalHeading, setPasswordModalHeading] = useState("Admin Created");

    const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
    const [passwordTarget, setPasswordTarget] = useState<AdminAccount | null>(null);
    const [passwordInput, setPasswordInput] = useState("");

    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const createModalRef = useRef<HTMLDivElement>(null);
    const editModalRef = useRef<HTMLDivElement>(null);
    const passwordModalRef = useRef<HTMLDivElement>(null);
    const updatePasswordModalRef = useRef<HTMLDivElement>(null);
    const statusModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: adminsResponse,
        isLoading,
        isFetching,
    } = useGetAllAdminAccountsQuery({ page, limit: PAGE_LIMIT, search });

    const [createAdminAccount, { isLoading: isCreating }] = useCreateAdminAccountMutation();
    const [updateAdminAccount, { isLoading: isUpdating }] = useUpdateAdminAccountMutation();
    const [disableAdminAccount, { isLoading: isDisabling }] = useDisableAdminAccountMutation();
    const [enableAdminAccount, { isLoading: isEnabling }] = useEnableAdminAccountMutation();
    const [resetAdminPassword, { isLoading: isUpdatingPassword }] = useResetAdminPasswordMutation();
    const isChangingStatus = isDisabling || isEnabling;

    const admins = ((adminsResponse as AdminAccountsResponse | undefined)?.data ?? []).map(
        mapApiAdminAccount,
    );

    const totalAdmins =
        parsePositiveInt((adminsResponse as AdminAccountsResponse | undefined)?.meta?.total) ??
        admins.length;

    const pageCount =
        parsePositiveInt((adminsResponse as AdminAccountsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalAdmins / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    function openCreateModal() {
        setForm(EMPTY_FORM);
        setIsCreateModalOpen(true);
    }

    function openEditModal(admin: AdminAccount) {
        setEditingAdmin(admin);
        setForm({
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
        });
        setIsEditModalOpen(true);
    }

    function togglePermission(permission: AdminPermission) {
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter((p) => p !== permission)
                : [...prev.permissions, permission],
        }));
    }

    function openStatusModal(admin: AdminAccount) {
        setPendingStatusChange({ admin, action: admin.isDisabled ? "enable" : "disable" });
        setIsStatusModalOpen(true);
    }

    function openUpdatePasswordModal(admin: AdminAccount) {
        setPasswordTarget(admin);
        setPasswordInput(generateSuggestedPassword());
        setIsUpdatePasswordModalOpen(true);
    }

    async function handleCreate(event: React.FormEvent) {
        event.preventDefault();
        try {
            const response = await createAdminAccount(form).unwrap();
            toast.success(response?.message ?? "Admin account created successfully");
            setIsCreateModalOpen(false);
            setPasswordModalHeading("Admin Created");
            setGeneratedPassword(response?.data?.generatedPassword ?? null);
            setIsPasswordModalOpen(true);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleEdit(event: React.FormEvent) {
        event.preventDefault();
        if (!editingAdmin) return;
        try {
            const response = await updateAdminAccount({ id: editingAdmin.id, body: form }).unwrap();
            toast.success(response?.message ?? "Admin account updated successfully");
            setIsEditModalOpen(false);
            setEditingAdmin(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleUpdatePassword(event: React.FormEvent) {
        event.preventDefault();
        if (!passwordTarget) return;
        const trimmed = passwordInput.trim();
        if (trimmed.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }
        try {
            const response = await resetAdminPassword({
                id: passwordTarget.id,
                body: { newPassword: trimmed },
            }).unwrap();
            toast.success(response?.message ?? "Password updated successfully");
            setIsUpdatePasswordModalOpen(false);
            setPasswordTarget(null);
            setPasswordModalHeading("Password Updated");
            setGeneratedPassword(response?.data?.generatedPassword ?? trimmed);
            setIsPasswordModalOpen(true);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleConfirmStatusChange() {
        if (!pendingStatusChange) return;
        try {
            const response =
                pendingStatusChange.action === "disable"
                    ? await disableAdminAccount(pendingStatusChange.admin.id).unwrap()
                    : await enableAdminAccount(pendingStatusChange.admin.id).unwrap();
            toast.success(response?.message ?? "Status updated successfully");
            setIsStatusModalOpen(false);
            setPendingStatusChange(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    function copyPassword() {
        if (!generatedPassword) return;
        navigator.clipboard?.writeText(generatedPassword);
        toast.success("Password copied to clipboard");
    }

    if (!isCurrentUserLoading && !isSuperAdmin) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    Only Super Admins can access Admin Management.
                </p>
            </section>
        );
    }

    return (
        <section>
            {/* Create Admin modal */}
            <Modal editModalRef={createModalRef} open={isCreateModalOpen} setOpen={setIsCreateModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[420px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <UserPlus className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Create Admin
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            aria-label="Close"
                            className="inline-flex h-8 w-8 items-center justify-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-[#001907]" />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="mt-5">
                        <label className="text-[14px] font-normal text-gray-11">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {form.role !== "super_admin" && (
                            <div className="mt-4">
                                <label className="block text-[14px] font-normal text-gray-11">
                                    Section Access
                                </label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {PERMISSION_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-[13px] text-[#001907]"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.permissions.includes(opt.value)}
                                                onChange={() => togglePermission(opt.value)}
                                                className="h-4 w-4 accent-green-1"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isCreating ? <BeatLoader color="white" size={8} /> : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Admin modal */}
            <Modal editModalRef={editModalRef} open={isEditModalOpen} setOpen={setIsEditModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[420px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <Pencil className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Edit Admin
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            aria-label="Close"
                            className="inline-flex h-8 w-8 items-center justify-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-[#001907]" />
                        </button>
                    </div>
                    <form onSubmit={handleEdit} className="mt-5">
                        <label className="text-[14px] font-normal text-gray-11">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {form.role !== "super_admin" && (
                            <div className="mt-4">
                                <label className="block text-[14px] font-normal text-gray-11">
                                    Section Access
                                </label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {PERMISSION_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-[13px] text-[#001907]"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.permissions.includes(opt.value)}
                                                onChange={() => togglePermission(opt.value)}
                                                className="h-4 w-4 accent-green-1"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isUpdating ? <BeatLoader color="white" size={8} /> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Generated password modal (shown once) */}
            <Modal editModalRef={passwordModalRef} open={isPasswordModalOpen} setOpen={setIsPasswordModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[420px] rounded-[12px] bg-white p-6 shadow-xl">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <ShieldCheck className="h-5 w-5 text-green-1" strokeWidth={2} />
                        {passwordModalHeading}
                    </h2>
                    <p className="mt-2 text-[13px] text-gray-8">
                        Copy this password now and share it securely — it won&apos;t be shown again.
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-[8px] border border-gray-9 bg-gray-10 px-3 py-2.5">
                        <span className="font-mono text-[14px] text-[#001907]">{generatedPassword}</span>
                        <button
                            type="button"
                            onClick={copyPassword}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                        </button>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsPasswordModalOpen(false)}
                            className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Update Password modal */}
            <Modal
                editModalRef={updatePasswordModalRef}
                open={isUpdatePasswordModalOpen}
                setOpen={setIsUpdatePasswordModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[420px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <KeyRound className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Update Password
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsUpdatePasswordModalOpen(false)}
                            aria-label="Close"
                            className="inline-flex h-8 w-8 items-center justify-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-[#001907]" />
                        </button>
                    </div>
                    <p className="mt-2 text-[13px] text-gray-8">
                        Set a new password for{" "}
                        <span className="font-medium text-[#001907]">{passwordTarget?.name}</span>. A
                        suggested password is pre-filled — use it as-is or type your own.
                    </p>
                    <form onSubmit={handleUpdatePassword} className="mt-4">
                        <label className="text-[14px] font-normal text-gray-11">New Password</label>
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="text"
                                required
                                minLength={8}
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 font-mono text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordInput(generateSuggestedPassword())}
                                aria-label="Regenerate suggested password"
                                className="inline-flex h-[38px] shrink-0 cursor-pointer items-center gap-1 rounded-[8px] border border-gray-9 px-3 text-[13px] font-medium text-gray-8 hover:border-green-1 hover:text-green-1"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Regenerate
                            </button>
                        </div>
                        <p className="mt-1.5 text-[12px] text-gray-11">Minimum 8 characters.</p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsUpdatePasswordModalOpen(false)}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdatingPassword}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isUpdatingPassword ? <BeatLoader color="white" size={8} /> : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Disable/Enable confirm modal */}
            <Modal editModalRef={statusModalRef} open={isStatusModalOpen} setOpen={setIsStatusModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingStatusChange?.action === "disable" ? "Disable admin" : "Enable admin"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to {pendingStatusChange?.action}{" "}
                        <span className="font-medium text-[#001907]">
                            {pendingStatusChange?.admin.name}
                        </span>
                        ? {pendingStatusChange?.action === "disable" && "They will no longer be able to log in."}
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsStatusModalOpen(false)}
                            disabled={isChangingStatus}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isChangingStatus}
                            onClick={handleConfirmStatusChange}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isChangingStatus ? <BeatLoader color="white" size={8} /> : "Confirm"}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Admin Management
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage admin-panel accounts and their roles
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
                            placeholder="Search by name or email..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-green-1 px-4 text-[14px] font-medium text-white"
                    >
                        <UserPlus className="h-4 w-4" strokeWidth={2} />
                        Create Admin
                    </button>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-[760px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Name</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Email</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Role</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Status</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Created</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && admins.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-[14px] text-gray-11">
                                            No admin accounts found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    admins.map((admin) => (
                                        <tr key={admin.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {admin.name}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {admin.email}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium ${ROLE_BADGE_STYLES[admin.role]}`}
                                                >
                                                    {ROLE_LABELS[admin.role]}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <ToggleSwitch
                                                    checked={!admin.isDisabled}
                                                    ariaLabel={admin.isDisabled ? `Enable ${admin.name}` : `Disable ${admin.name}`}
                                                    onChange={() => openStatusModal(admin)}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {admin.createdAt}
                                            </td>
                                            <td className="py-3.5">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(admin)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openUpdatePasswordModal(admin)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-gray-8 hover:text-green-1 hover:underline"
                                                    >
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                        Password
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

export default AdminAccounts;
