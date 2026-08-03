"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Copy, KeyRound, Pencil, RefreshCw, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import {
    useGetAllMembersQuery,
    useCreateMemberMutation,
    useUpdateMemberMutation,
    useDeleteMemberMutation,
    useResetMemberPasswordMutation,
} from "@/store/services/adminService";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import searchIcon from "@/assets/icons/searchIcon.svg";
import Image from "next/image";

type Member = {
    id: string;
    name: string;
    email: string;
    createdAt: string;
};

type ApiMember = {
    _id?: string;
    name?: string;
    email?: string;
    createdAt?: string;
};

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function mapApiMember(member: ApiMember): Member {
    return {
        id: member._id ?? "",
        name: member.name ?? "-",
        email: member.email ?? "-",
        createdAt: formatDate(member.createdAt),
    };
}

/** Client-side suggestion only — the actual value stored is whatever's in the field on submit. */
function generateSuggestedPassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (value) => chars[value % chars.length]).join("");
}

const EMPTY_FORM = { name: "", email: "" };

function MemberManagement() {
    const { isLoading: isCurrentUserLoading, isSuperAdmin, has, canEdit, canDelete } =
        useCurrentAdminPermissions();
    const canManageMembers = isSuperAdmin || has("members");

    const [searchInput, setSearchInput] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", email: "" });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);

    const [pendingDelete, setPendingDelete] = useState<Member | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordModalHeading, setPasswordModalHeading] = useState("Member Created");

    const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
    const [passwordTarget, setPasswordTarget] = useState<Member | null>(null);
    const [passwordInput, setPasswordInput] = useState("");

    const createModalRef = useRef<HTMLDivElement>(null);
    const editModalRef = useRef<HTMLDivElement>(null);
    const deleteModalRef = useRef<HTMLDivElement>(null);
    const passwordModalRef = useRef<HTMLDivElement>(null);
    const updatePasswordModalRef = useRef<HTMLDivElement>(null);

    const { data: membersResponse, isLoading, isFetching } = useGetAllMembersQuery(undefined, {
        skip: !canManageMembers,
    });

    const [createMember, { isLoading: isCreating }] = useCreateMemberMutation();
    const [updateMember, { isLoading: isUpdating }] = useUpdateMemberMutation();
    const [deleteMember, { isLoading: isDeleting }] = useDeleteMemberMutation();
    const [resetMemberPassword, { isLoading: isUpdatingPassword }] = useResetMemberPasswordMutation();

    const members = ((membersResponse as { data?: ApiMember[] } | undefined)?.data ?? []).map(
        mapApiMember,
    );

    const filteredMembers = searchInput.trim()
        ? members.filter((member) => {
              const term = searchInput.trim().toLowerCase();
              return (
                  member.name.toLowerCase().includes(term) ||
                  member.email.toLowerCase().includes(term)
              );
          })
        : members;

    const loading = isLoading || isFetching;

    function openCreateModal() {
        setCreateForm({ ...EMPTY_FORM, email: "" });
        setIsCreateModalOpen(true);
    }

    function openEditModal(member: Member) {
        setEditingMember(member);
        setEditForm({ name: member.name, email: member.email });
        setIsEditModalOpen(true);
    }

    function openDeleteModal(member: Member) {
        setPendingDelete(member);
        setIsDeleteModalOpen(true);
    }

    function openUpdatePasswordModal(member: Member) {
        setPasswordTarget(member);
        setPasswordInput(generateSuggestedPassword());
        setIsUpdatePasswordModalOpen(true);
    }

    async function handleCreate(event: React.FormEvent) {
        event.preventDefault();
        try {
            const response = await createMember(createForm).unwrap();
            toast.success(response?.message ?? "Member created successfully");
            setIsCreateModalOpen(false);
            setPasswordModalHeading("Member Created");
            setGeneratedPassword(response?.data?.generatedPassword ?? null);
            setIsPasswordModalOpen(true);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleEdit(event: React.FormEvent) {
        event.preventDefault();
        if (!editingMember) return;
        try {
            const response = await updateMember({ id: editingMember.id, body: editForm }).unwrap();
            toast.success(response?.message ?? "Member updated successfully");
            setIsEditModalOpen(false);
            setEditingMember(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleConfirmDelete() {
        if (!pendingDelete) return;
        try {
            const response = await deleteMember(pendingDelete.id).unwrap();
            toast.success(response?.message ?? "Member deleted successfully");
            setIsDeleteModalOpen(false);
            setPendingDelete(null);
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
            const response = await resetMemberPassword({
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

    function copyPassword() {
        if (!generatedPassword) return;
        navigator.clipboard?.writeText(generatedPassword);
        toast.success("Password copied to clipboard");
    }

    if (!isCurrentUserLoading && !canManageMembers) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    Only Admins and Super Admins can manage members.
                </p>
            </section>
        );
    }

    return (
        <section>
            {/* Create Member modal */}
            <Modal editModalRef={createModalRef} open={isCreateModalOpen} setOpen={setIsCreateModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[400px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <UserPlus className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Create Member
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
                        <label className="text-[14px] font-normal text-gray-11">Full Name</label>
                        <input
                            type="text"
                            required
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Email</label>
                        <input
                            type="email"
                            required
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
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
                                {isCreating ? <BeatLoader color="white" size={8} /> : "Create Member"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Member modal */}
            <Modal editModalRef={editModalRef} open={isEditModalOpen} setOpen={setIsEditModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[400px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <Pencil className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Edit Member
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
                        <label className="text-[14px] font-normal text-gray-11">Full Name</label>
                        <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Email</label>
                        <input
                            type="email"
                            required
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />
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

            {/* Delete confirm modal */}
            <Modal editModalRef={deleteModalRef} open={isDeleteModalOpen} setOpen={setIsDeleteModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">Delete member</h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-[#001907]">{pendingDelete?.name}</span>? Tasks
                        assigned to them will remain but will need to be reassigned.
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
                            {isDeleting ? <BeatLoader color="white" size={8} /> : "Delete"}
                        </button>
                    </div>
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

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">Members</h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Create members and assign tasks to them
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
                        disabled={!canEdit("members")}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <UserPlus className="h-4 w-4" strokeWidth={2} />
                        Create Member
                    </button>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[640px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Name</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Email</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Created</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 8 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 4 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-[14px] text-gray-11">
                                            No members found. Create your first member to get started.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    filteredMembers.map((member) => (
                                        <tr key={member.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {member.name}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {member.email}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {member.createdAt}
                                            </td>
                                            <td className="py-3.5">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(member)}
                                                        disabled={!canEdit("members")}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openUpdatePasswordModal(member)}
                                                        disabled={!canEdit("members")}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-gray-8 hover:text-green-1 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                                                    >
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                        Password
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(member)}
                                                        disabled={!canDelete("members")}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-[#E92440] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MemberManagement;
