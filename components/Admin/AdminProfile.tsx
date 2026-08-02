"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import {
    User,
    Mail,
    Phone,
    Circle,
    Calendar,
    Camera,
    TriangleAlert,
    Trash2,
    SquarePen,
} from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import EditProfileModal from "@/components/Admin/EditProfileModal";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { useGetUserDetailQuery } from "@/store/services/adminService";
import { useDeleteAccountMutation } from "@/store/services/authService";
import { beginLogout, logout } from "@/store/reducers/authReducer";

type ApiUserDetail = {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    roles?: string[];
    createdAt?: string;
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatDate(dateString?: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
};

function toAdminRole(roles?: string[]): string {
    if (roles?.includes("super_admin")) return "super_admin";
    if (roles?.includes("moderator")) return "moderator";
    return "admin";
}

function AdminProfile() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const userId = useAppSelector((state) => state.authReducer.userId);
    const { data, isLoading, isFetching } = useGetUserDetailQuery(userId, {
        skip: !userId,
    });
    const user = (data as { data?: ApiUserDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const deleteModalRef = useRef<HTMLDivElement>(null);

    const role = toAdminRole(user?.roles);
    const roleLabel = ROLE_LABELS[role] ?? capitalize(role);

    async function handleConfirmDelete() {
        if (!userId) return;

        try {
            const response = await deleteAccount({ id: userId }).unwrap();
            toast.success(response?.message ?? "Account deleted successfully");
            setIsDeleteModalOpen(false);
            dispatch(beginLogout());
            dispatch(logout());
            router.push("/en/signin");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    const rows = [
        { label: "Full Name", value: user?.name ?? "-", icon: User },
        { label: "Email", value: user?.email ?? "-", icon: Mail },
        { label: "Phone", value: user?.phone ?? "-", icon: Phone },
        { label: "Role", value: roleLabel, icon: Circle },
        { label: "Member Since", value: formatDate(user?.createdAt), icon: Calendar },
    ];

    return (
        <section>
            <Modal
                editModalRef={deleteModalRef}
                open={isDeleteModalOpen}
                setOpen={setIsDeleteModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">Delete account</h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to permanently remove your account? This cannot be
                        undone.
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isDeleting ? <BeatLoader color="white" size={8} /> : "Delete Account"}
                        </button>
                    </div>
                </div>
            </Modal>

            <EditProfileModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

            <div className="bg-[#F6F8FA] pb-10">
                <div className="container mx-auto px-5 pt-8 lg:px-10">
                    {loading ? (
                        <div className="mx-auto h-40 max-w-[560px] animate-pulse rounded-[12px] bg-gray-200" />
                    ) : !user ? (
                        <p className="text-[14px] text-gray-11">Unable to load profile.</p>
                    ) : (
                        <div className="mx-auto max-w-[560px]">
                            <div className="rounded-[12px] bg-green-4 px-6 pb-6 pt-8 text-center">
                                <div className="relative mx-auto inline-flex">
                                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-9 text-[20px] font-semibold text-gray-8">
                                        {getInitials(user.name ?? "-")}
                                    </span>
                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-1 text-white ring-2 ring-green-4">
                                        <Camera className="h-3 w-3" strokeWidth={2} />
                                    </span>
                                </div>
                                <p className="mt-3 text-[16px] font-semibold text-[#001907]">
                                    {user.name ?? "-"}
                                </p>
                                <span className="mt-1 inline-flex rounded-full bg-green-3 px-3 py-1 text-[12px] font-medium text-green-1">
                                    {roleLabel}
                                </span>

                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-white px-4 py-2 text-[13px] font-medium text-green-1"
                                    >
                                        <SquarePen className="h-4 w-4" strokeWidth={2} />
                                        Edit Profile
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 overflow-hidden rounded-[12px] border border-gray-9 bg-white">
                                {rows.map((row, index) => {
                                    const Icon = row.icon;
                                    return (
                                        <div
                                            key={row.label}
                                            className={`flex items-center gap-3 px-5 py-4 ${index > 0 ? "border-t border-gray-9" : ""
                                                }`}
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-green-4">
                                                <Icon className="h-4 w-4 text-green-1" strokeWidth={2} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[12px] text-gray-11">{row.label}</p>
                                                <p className="truncate text-[14px] font-medium text-[#001907]">
                                                    {row.value}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#FDD5D5]">
                                <div className="flex items-center gap-3 bg-[#FDF2F2] px-5 py-4">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#FDD5D5]">
                                        <TriangleAlert
                                            className="h-4 w-4 text-[#E92440]"
                                            strokeWidth={2}
                                        />
                                    </span>
                                    <div>
                                        <p className="text-[14px] font-semibold text-[#E92440]">
                                            Danger Zone
                                        </p>
                                        <p className="text-[12px] text-[#C23652]">
                                            Permanent actions that cannot be undone
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-4">
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-medium text-[#001907]">
                                            Delete My Account
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-gray-11">
                                            Permanently disable your account.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-[#E92440] px-4 py-2 text-[14px] font-medium text-white"
                                    >
                                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default AdminProfile;
