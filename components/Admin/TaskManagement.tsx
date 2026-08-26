"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ClipboardCheck, ListTodo, Pencil, Trash2 } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import {
    useGetAllTasksQuery,
    useGetAllMembersQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useReviewTaskMutation,
    useGetUserDetailQuery,
} from "@/store/services/adminService";
import { useAppSelector } from "@/store/store";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import searchIcon from "@/assets/icons/searchIcon.svg";
import Image from "next/image";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 20;

const PRIORITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "revision", label: "Revision" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_BADGE_STYLES: Record<string, string> = {
    low: "bg-gray-10 text-gray-8",
    medium: "bg-[#FDEAB8] text-[#946200]",
    high: "bg-[#FDD5D5] text-[#E92440]",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
    pending: "bg-[#E7F0FF] text-[#2F6FE4]",
    in_progress: "bg-[#FDEAB8] text-[#946200]",
    submitted: "bg-[#F1E9FE] text-[#7C4FE0]",
    revision: "bg-[#FDD5D5] text-[#E92440]",
    completed: "bg-green-4 text-green-1",
    cancelled: "bg-gray-10 text-gray-8",
};

function labelFor(options: { value: string; label: string }[], value: string) {
    return options.find((opt) => opt.value === value)?.label ?? value;
}

type Member = { _id: string; name?: string; email?: string };

type TaskSubmission = {
    notes?: string;
    link?: string;
    attachments?: { url: string; name: string }[];
    submittedBy?: { _id?: string; name?: string; email?: string } | string;
    submittedAt?: string;
};

type ApiTask = {
    _id?: string;
    title?: string;
    description?: string;
    assignees?: Member[];
    priority?: string;
    status?: string;
    dueDate?: string;
    createdAt?: string;
    submissions?: TaskSubmission[];
    revisionReason?: string;
};

type Task = {
    id: string;
    title: string;
    description: string;
    assignees: Member[];
    priority: string;
    status: string;
    dueDate: string;
    dueDateInput: string;
    submissions: TaskSubmission[];
    revisionReason: string;
};

type TasksResponse = { data?: ApiTask[]; meta?: { total?: number | string; totalPages?: number | string } };
type MembersResponse = { data?: Member[] };

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function mapApiTask(task: ApiTask): Task {
    return {
        id: task._id ?? "",
        title: task.title ?? "-",
        description: task.description ?? "",
        assignees: task.assignees ?? [],
        priority: task.priority ?? "medium",
        status: task.status ?? "pending",
        dueDate: task.dueDate ? formatDate(task.dueDate) : "-",
        dueDateInput: task.dueDate ? task.dueDate.slice(0, 10) : "",
        submissions: task.submissions ?? [],
        revisionReason: task.revisionReason ?? "",
    };
}

type FormState = {
    title: string;
    description: string;
    assignees: string[];
    priority: string;
    status: string;
    dueDate: string;
};

const EMPTY_FORM: FormState = {
    title: "",
    description: "",
    assignees: [],
    priority: "medium",
    status: "pending",
    dueDate: "",
};

function TaskManagement() {
    const currentUserId = useAppSelector((state) => state.authReducer.userId);
    const { data: currentUserData, isLoading: isCurrentUserLoading } = useGetUserDetailQuery(
        currentUserId,
        { skip: !currentUserId },
    );
    const currentUserRoles =
        (currentUserData as { data?: { roles?: string[] } } | undefined)?.data?.roles ?? [];
    const isSuperAdmin = currentUserRoles.includes("super_admin");
    const canManageTasks = isSuperAdmin || currentUserRoles.includes("admin");

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [reviewingTask, setReviewingTask] = useState<Task | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [revisionReason, setRevisionReason] = useState("");
    const [showRevisionInput, setShowRevisionInput] = useState(false);

    const createModalRef = useRef<HTMLDivElement>(null);
    const editModalRef = useRef<HTMLDivElement>(null);
    const deleteModalRef = useRef<HTMLDivElement>(null);
    const reviewModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: tasksResponse,
        isLoading,
        isFetching,
    } = useGetAllTasksQuery(
        { page, limit: PAGE_LIMIT, search, status: statusFilter },
        { skip: !canManageTasks },
    );
    const { data: membersResponse } = useGetAllMembersQuery(undefined, {
        skip: !canManageTasks,
    });

    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    const [reviewTask, { isLoading: isReviewing }] = useReviewTaskMutation();

    const tasks = ((tasksResponse as TasksResponse | undefined)?.data ?? []).map(mapApiTask);
    const members = (membersResponse as MembersResponse | undefined)?.data ?? [];

    const totalTasks =
        parsePositiveInt((tasksResponse as TasksResponse | undefined)?.meta?.total) ?? tasks.length;
    const pageCount =
        parsePositiveInt((tasksResponse as TasksResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalTasks / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    function openCreateModal() {
        setForm(EMPTY_FORM);
        setIsCreateModalOpen(true);
    }

    function openEditModal(task: Task) {
        setEditingTask(task);
        setForm({
            title: task.title,
            description: task.description,
            assignees: task.assignees.map((assignee) => assignee._id),
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDateInput,
        });
        setIsEditModalOpen(true);
    }

    function toggleAssignee(memberId: string) {
        setForm((prev) => ({
            ...prev,
            assignees: prev.assignees.includes(memberId)
                ? prev.assignees.filter((id) => id !== memberId)
                : [...prev.assignees, memberId],
        }));
    }

    function openDeleteModal(task: Task) {
        setPendingDelete(task);
        setIsDeleteModalOpen(true);
    }

    async function handleCreate(event: React.FormEvent) {
        event.preventDefault();
        if (form.assignees.length === 0) {
            toast.error("Select at least one member to assign this task to");
            return;
        }
        try {
            const response = await createTask({
                title: form.title,
                description: form.description || undefined,
                assignees: form.assignees,
                priority: form.priority,
                dueDate: form.dueDate || undefined,
            }).unwrap();
            toast.success(response?.message ?? "Task created successfully");
            setIsCreateModalOpen(false);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleEdit(event: React.FormEvent) {
        event.preventDefault();
        if (!editingTask) return;
        if (form.assignees.length === 0) {
            toast.error("Select at least one member to assign this task to");
            return;
        }
        try {
            const response = await updateTask({
                id: editingTask.id,
                body: {
                    title: form.title,
                    description: form.description || undefined,
                    assignees: form.assignees,
                    priority: form.priority,
                    status: form.status,
                    dueDate: form.dueDate || undefined,
                },
            }).unwrap();
            toast.success(response?.message ?? "Task updated successfully");
            setIsEditModalOpen(false);
            setEditingTask(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    function openReviewModal(task: Task) {
        setReviewingTask(task);
        setRevisionReason("");
        setShowRevisionInput(false);
        setIsReviewModalOpen(true);
    }

    async function handleReview(decision: "completed" | "revision") {
        if (!reviewingTask) return;
        if (decision === "revision" && !revisionReason.trim()) {
            toast.error("Please write a reason for the revision");
            return;
        }
        try {
            const response = await reviewTask({
                id: reviewingTask.id,
                body: {
                    decision,
                    ...(decision === "revision" ? { reason: revisionReason.trim() } : {}),
                },
            }).unwrap();
            toast.success(response?.message ?? "Review saved");
            setIsReviewModalOpen(false);
            setReviewingTask(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleConfirmDelete() {
        if (!pendingDelete) return;
        try {
            const response = await deleteTask(pendingDelete.id).unwrap();
            toast.success(response?.message ?? "Task deleted successfully");
            setIsDeleteModalOpen(false);
            setPendingDelete(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    if (!isCurrentUserLoading && !canManageTasks) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    Only Admins and Super Admins can manage tasks.
                </p>
            </section>
        );
    }

    const formFields = (
        <>
            <label className="text-[14px] font-normal text-gray-11">Title</label>
            <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
            />
            <label className="mt-4 block text-[14px] font-normal text-gray-11">Description (optional)</label>
            <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
            />

            <div className="mt-4">
                <label className="block text-[14px] font-normal text-gray-11">Assignees</label>
                <div className="mt-2 max-h-[180px] space-y-2 overflow-y-auto rounded-[8px] border border-gray-9 p-2">
                    {members.length === 0 && (
                        <p className="px-2 py-2 text-[13px] text-gray-11">
                            No members yet — create one on the Members page first
                        </p>
                    )}
                    {members.map((member) => (
                        <label
                            key={member._id}
                            className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-[13px] text-[#001907] hover:bg-gray-10"
                        >
                            <input
                                type="checkbox"
                                checked={form.assignees.includes(member._id)}
                                onChange={() => toggleAssignee(member._id)}
                                className="h-4 w-4 accent-green-1"
                            />
                            {member.name}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[14px] font-normal text-gray-11">Priority</label>
                    <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    >
                        {PRIORITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[14px] font-normal text-gray-11">Due Date</label>
                    <input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    />
                </div>
            </div>
        </>
    );

    return (
        <section>
            {/* Create Task modal */}
            <Modal editModalRef={createModalRef} open={isCreateModalOpen} setOpen={setIsCreateModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[460px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <ListTodo className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Assign Task
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
                        {formFields}
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
                                {isCreating ? <BeatLoader color="white" size={8} /> : "Assign Task"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Task modal */}
            <Modal editModalRef={editModalRef} open={isEditModalOpen} setOpen={setIsEditModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[460px] rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <Pencil className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Edit Task
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
                        {formFields}
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
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
                    <h2 className="text-[16px] font-semibold text-black-1">Delete task</h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-[#001907]">{pendingDelete?.title}</span>?
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

            {/* Review submission modal */}
            <Modal editModalRef={reviewModalRef} open={isReviewModalOpen} setOpen={setIsReviewModalOpen} centered>
                <div className="hide-scrollbar max-h-[85vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <ClipboardCheck className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Review Submission
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsReviewModalOpen(false)}
                            aria-label="Close"
                            className="inline-flex h-8 w-8 items-center justify-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-[#001907]" />
                        </button>
                    </div>

                    {(() => {
                        const latest = reviewingTask?.submissions[reviewingTask.submissions.length - 1];
                        const submitter =
                            latest && typeof latest.submittedBy === "object" ? latest.submittedBy?.name : undefined;
                        return (
                            <div className="mt-4">
                                <p className="text-[15px] font-medium text-[#001907]">{reviewingTask?.title}</p>
                                {latest ? (
                                    <div className="mt-3 rounded-[8px] border border-gray-9 bg-[#F6F8FA] p-3">
                                        <p className="text-[12px] text-gray-11">
                                            Submitted by {submitter ?? "member"}
                                            {latest.submittedAt ? ` on ${formatDate(latest.submittedAt)}` : ""}
                                        </p>
                                        <p className="mt-2 whitespace-pre-line text-[14px] text-[#001907]">
                                            {latest.notes}
                                        </p>
                                        {latest.link && (
                                            <a
                                                href={latest.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 block break-all text-[13px] font-medium text-green-1 hover:underline"
                                            >
                                                {latest.link}
                                            </a>
                                        )}
                                        {(latest.attachments?.length ?? 0) > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {latest.attachments!.map((file, index) => (
                                                    <li key={index}>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="break-all text-[13px] font-medium text-green-1 hover:underline"
                                                        >
                                                            {file.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-[13px] text-gray-11">No submission details found.</p>
                                )}

                                {showRevisionInput && (
                                    <div className="mt-4">
                                        <label className="block text-[14px] font-normal text-gray-11">
                                            Revision reason
                                        </label>
                                        <textarea
                                            value={revisionReason}
                                            onChange={(e) => setRevisionReason(e.target.value)}
                                            rows={3}
                                            placeholder="Tell the member what needs to change..."
                                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                        />
                                    </div>
                                )}

                                <div className="mt-6 flex gap-3">
                                    {showRevisionInput ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setShowRevisionInput(false)}
                                                disabled={isReviewing}
                                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isReviewing}
                                                onClick={() => handleReview("revision")}
                                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isReviewing ? <BeatLoader color="white" size={8} /> : "Send for Revision"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setShowRevisionInput(true)}
                                                disabled={isReviewing}
                                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] text-[14px] font-medium text-[#E92440] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Request Revision
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isReviewing}
                                                onClick={() => handleReview("completed")}
                                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isReviewing ? <BeatLoader color="white" size={8} /> : "Approve"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">Tasks</h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Track and assign admin follow-up tasks
                    </p>
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center justify-between gap-3 px-5 lg:px-10">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative max-w-[280px] flex-1">
                            <Image
                                src={searchIcon}
                                alt=""
                                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                            />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search by task title..."
                                className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            <option value="">All Statuses</option>
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-green-1 px-4 text-[14px] font-medium text-white"
                    >
                        <ListTodo className="h-4 w-4" strokeWidth={2} />
                        Assign Task
                    </button>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[780px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Title</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Assignees</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Priority</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Status</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Due Date</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 8 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && tasks.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-[14px] text-gray-11">
                                            No tasks found. Assign your first task to a member.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    tasks.map((task) => (
                                        <tr key={task.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {task.title}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {task.assignees.map((a) => a.name).join(", ") || "-"}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium ${PRIORITY_BADGE_STYLES[task.priority]}`}
                                                >
                                                    {labelFor(PRIORITY_OPTIONS, task.priority)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium ${STATUS_BADGE_STYLES[task.status]}`}
                                                >
                                                    {labelFor(STATUS_OPTIONS, task.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {task.dueDate}
                                            </td>
                                            <td className="py-3.5">
                                                <div className="flex items-center justify-center gap-4">
                                                    {task.status === "submitted" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openReviewModal(task)}
                                                            className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-[#7C4FE0] hover:underline"
                                                        >
                                                            <ClipboardCheck className="h-3.5 w-3.5" />
                                                            Review
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(task)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(task)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-[#E92440] hover:underline"
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

export default TaskManagement;
