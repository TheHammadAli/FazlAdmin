"use client";

import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import { useGetMyTasksQuery } from "@/store/services/adminService";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import { parsePositiveInt } from "@/utils/parsePositiveInt";

const PAGE_LIMIT = 20;

/** Member-facing labels: "pending" means the task was assigned and not yet worked,
 *  while "submitted" means it's waiting on the admin's review. */
const STATUS_OPTIONS = [
    { value: "pending", label: "Assigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Pending Review" },
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

const PRIORITY_LABELS: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

function statusLabel(value: string) {
    return STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
}

type ApiTask = {
    _id?: string;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    createdBy?: { name?: string; email?: string };
    attachments?: { url: string; name: string }[];
    revisionReason?: string;
};

type TasksResponse = { data?: ApiTask[]; meta?: { total?: number | string; totalPages?: number | string } };

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function MemberTasks() {
    const { isLoading: isPermsLoading, roles } = useCurrentAdminPermissions();
    const isMember = roles.includes("moderator");

    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const linkedStatus = params.get("status");
        if (linkedStatus) {
            setStatusFilter(linkedStatus);
        }
    }, []);

    const {
        data: tasksResponse,
        isLoading,
        isFetching,
    } = useGetMyTasksQuery(
        { page, limit: PAGE_LIMIT, status: statusFilter },
        { skip: !isMember },
    );

    const tasks = (tasksResponse as TasksResponse | undefined)?.data ?? [];
    const totalTasks =
        parsePositiveInt((tasksResponse as TasksResponse | undefined)?.meta?.total) ?? tasks.length;
    const pageCount =
        parsePositiveInt((tasksResponse as TasksResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalTasks / PAGE_LIMIT));

    const loading = isLoading || isFetching;

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
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">Tasks Assigned</h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Tasks assigned to you by the admin team
                    </p>
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center gap-3 px-5 lg:px-10">
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
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Title</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Assigned By</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Priority</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Status</th>
                                    <th className="py-3 text-[14px] font-medium text-[#001907]">Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 8 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 5 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && tasks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-[14px] text-gray-11">
                                            No tasks assigned to you yet.
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    tasks.map((task) => (
                                        <tr key={task._id} className="bg-white align-top">
                                            <td className="py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {task.title ?? "-"}
                                                {task.description && (
                                                    <p className="mt-1 max-w-[320px] text-[12px] text-gray-11">
                                                        {task.description}
                                                    </p>
                                                )}
                                                {(task.attachments?.length ?? 0) > 0 && (
                                                    <ul className="mt-1.5 space-y-1">
                                                        {task.attachments!.map((file, index) => (
                                                            <li key={index}>
                                                                <a
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 break-all text-[12px] font-medium text-green-1 hover:underline"
                                                                >
                                                                    <Paperclip className="h-3 w-3 shrink-0" />
                                                                    {file.name}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {task.createdBy?.name ?? "-"}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium ${PRIORITY_BADGE_STYLES[task.priority ?? "medium"]}`}
                                                >
                                                    {PRIORITY_LABELS[task.priority ?? "medium"] ?? task.priority}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium ${STATUS_BADGE_STYLES[task.status ?? "pending"]}`}
                                                >
                                                    {statusLabel(task.status ?? "pending")}
                                                </span>
                                                {task.status === "revision" && task.revisionReason && (
                                                    <p className="mt-1 max-w-[240px] text-[12px] text-[#E92440]">
                                                        {task.revisionReason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 text-[14px] font-normal text-gray-11">
                                                {formatDate(task.dueDate)}
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

export default MemberTasks;
