"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Paperclip, Upload, X } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetMyTasksQuery, useSubmitTaskMutation } from "@/store/services/adminService";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";

const MAX_ATTACHMENTS = 5;
/** Statuses a member may submit work from — must match the backend's SUBMITTABLE_STATUSES. */
const SUBMITTABLE_STATUSES = ["pending", "in_progress", "revision"];

const STATUS_BADGE_STYLES: Record<string, string> = {
    submitted: "bg-[#F1E9FE] text-[#7C4FE0]",
    revision: "bg-[#FDD5D5] text-[#E92440]",
    completed: "bg-green-4 text-green-1",
};

/** Member-facing: a task under review shows as "Pending" until the admin decides. */
const STATUS_LABELS: Record<string, string> = {
    submitted: "Pending",
    revision: "Revision",
    completed: "Completed",
};

type ApiTask = {
    _id?: string;
    title?: string;
    status?: string;
    revisionReason?: string;
    submissions?: { submittedAt?: string }[];
};

type TasksResponse = { data?: ApiTask[] };

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function SubmitTask() {
    const { isLoading: isPermsLoading, roles } = useCurrentAdminPermissions();
    const isMember = roles.includes("moderator");

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [notes, setNotes] = useState("");
    const [link, setLink] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [statusFilter, setStatusFilter] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const submitModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const linkedStatus = params.get("status");
        if (linkedStatus) {
            setStatusFilter(linkedStatus);
        }
    }, []);

    // One list feeds both the modal's task select and the submissions table below.
    const { data: tasksResponse, isLoading } = useGetMyTasksQuery(
        { page: 1, limit: 100 },
        { skip: !isMember },
    );
    const [submitTask, { isLoading: isSubmitting }] = useSubmitTaskMutation();

    const allTasks = (tasksResponse as TasksResponse | undefined)?.data ?? [];
    const submittableTasks = allTasks.filter((task) =>
        SUBMITTABLE_STATUSES.includes(task.status ?? ""),
    );
    const submissionRows = allTasks.filter((task) => {
        const hasHistory =
            (task.submissions?.length ?? 0) > 0 ||
            ["submitted", "revision", "completed"].includes(task.status ?? "");
        if (!hasHistory) return false;
        if (statusFilter) return task.status === statusFilter;
        return true;
    });

    function resetForm() {
        setSelectedTaskId("");
        setNotes("");
        setLink("");
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function openSubmitModal(taskId = "") {
        resetForm();
        setSelectedTaskId(taskId);
        setIsSubmitModalOpen(true);
    }

    function handleFilesChosen(fileList: FileList | null) {
        if (!fileList) return;
        const chosen = Array.from(fileList);
        setFiles((prev) => [...prev, ...chosen].slice(0, MAX_ATTACHMENTS));
    }

    function removeFile(index: number) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!selectedTaskId) {
            toast.error("Select a task to submit");
            return;
        }
        if (!notes.trim()) {
            toast.error("Please write notes about the work you did");
            return;
        }
        const formData = new FormData();
        formData.append("notes", notes.trim());
        if (link.trim()) formData.append("link", link.trim());
        files.forEach((file) => formData.append("attachments", file));

        try {
            const response = await submitTask({ id: selectedTaskId, formData }).unwrap();
            toast.success(response?.message ?? "Task submitted for review");
            setIsSubmitModalOpen(false);
            resetForm();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    if (!isPermsLoading && !isMember) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    This page is only for member accounts.
                </p>
            </section>
        );
    }

    return (
        <section>
            {/* Submit Task modal */}
            <Modal editModalRef={submitModalRef} open={isSubmitModalOpen} setOpen={setIsSubmitModalOpen} centered>
                <div className="hide-scrollbar max-h-[90vh] w-[92vw] max-w-[460px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <Upload className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Submit Task
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsSubmitModalOpen(false)}
                            aria-label="Close"
                            className="inline-flex h-8 w-8 items-center justify-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-[#001907]" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5">
                        <label className="block text-[14px] font-normal text-gray-11">Task</label>
                        <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            <option value="">
                                {isLoading
                                    ? "Loading your tasks..."
                                    : submittableTasks.length === 0
                                        ? "No tasks available to submit"
                                        : "Select a task..."}
                            </option>
                            {submittableTasks.map((task) => (
                                <option key={task._id} value={task._id}>
                                    {task.title}
                                    {task.status === "revision" ? " (revision requested)" : ""}
                                </option>
                            ))}
                        </select>

                        <label className="mt-4 block text-[14px] font-normal text-gray-11">
                            What did you do?
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            required
                            placeholder="Describe the work you completed..."
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />

                        <label className="mt-4 block text-[14px] font-normal text-gray-11">
                            Link (optional)
                        </label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://..."
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        />

                        <label className="mt-4 block text-[14px] font-normal text-gray-11">
                            Attachments (optional, up to {MAX_ATTACHMENTS})
                        </label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={files.length >= MAX_ATTACHMENTS}
                            className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-[13px] font-medium text-gray-8 hover:border-green-1 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Paperclip className="h-4 w-4" strokeWidth={2} />
                            Add files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                handleFilesChosen(e.target.files);
                                e.target.value = "";
                            }}
                        />
                        {files.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {files.map((file, index) => (
                                    <li
                                        key={`${file.name}-${index}`}
                                        className="flex items-center justify-between gap-2 rounded-[8px] bg-gray-10 px-3 py-1.5 text-[13px] text-[#001907]"
                                    >
                                        <span className="min-w-0 truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            aria-label={`Remove ${file.name}`}
                                            className="shrink-0 cursor-pointer text-gray-8 hover:text-[#E92440]"
                                        >
                                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSubmitModalOpen(false)}
                                disabled={isSubmitting}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex h-[40px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <BeatLoader color="white" size={8} />
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" strokeWidth={2} />
                                        Submit for Review
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">Submit Task</h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Submit your completed work for admin review
                    </p>
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center justify-between gap-3 px-5 lg:px-10">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    >
                        <option value="">All Statuses</option>
                        <option value="submitted">Pending</option>
                        <option value="revision">Revision</option>
                        <option value="completed">Completed</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => openSubmitModal()}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-green-1 px-4 text-[14px] font-medium text-white"
                    >
                        <Upload className="h-4 w-4" strokeWidth={2} />
                        Submit Task
                    </button>
                </div>
            </div>

            <div className="bg-white pb-10">
                <div className="container mx-auto px-5 pt-4 lg:px-10">
                    <h2 className="text-[16px] font-semibold text-[#001907]">My Submissions</h2>

                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-[640px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Task</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Last Submitted</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Status</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading &&
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            {Array.from({ length: 4 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!isLoading && submissionRows.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-[14px] text-gray-11">
                                            You haven&apos;t submitted any tasks yet.
                                        </td>
                                    </tr>
                                )}

                                {!isLoading &&
                                    submissionRows.map((task) => {
                                        const lastSubmission =
                                            task.submissions?.[task.submissions.length - 1];
                                        const status = task.status ?? "";
                                        return (
                                            <tr key={task._id} className="align-top">
                                                <td className="py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                    {task.title ?? "-"}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {formatDate(lastSubmission?.submittedAt)}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium ${STATUS_BADGE_STYLES[status] ?? "bg-gray-10 text-gray-8"}`}
                                                    >
                                                        {STATUS_LABELS[status] ?? status}
                                                    </span>
                                                    {status === "revision" && task.revisionReason && (
                                                        <p className="mt-1 max-w-[280px] text-[12px] text-[#E92440]">
                                                            {task.revisionReason}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    {status === "revision" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openSubmitModal(task._id ?? "")}
                                                            className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                        >
                                                            <Upload className="h-3.5 w-3.5" />
                                                            Resubmit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default SubmitTask;
