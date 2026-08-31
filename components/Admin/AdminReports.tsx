"use client";

import { useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Flag, Eye, Trash2, CheckCircle2, Clock, ShieldAlert, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import Modal from "@/components/Ui/Modals/Modal";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import {
    useGetAllReportsForAdminQuery,
    useCloseReportMutation,
    useRemoveReportedContentMutation,
    useRespondToReportMutation,
} from "@/store/services/adminService";

type ReportReason = "Spam" | "Adult Content" | "Fraud" | "Duplicate" | "Other";
type ReportStatus = "open" | "closed";
type ContentType = "Listing" | "Shop" | "Service" | "User";

type Report = {
    id: string;
    reportCode: string;
    contentType: ContentType;
    contentTitle: string;
    reportedBy: string;
    reason: ReportReason;
    details: string;
    status: ReportStatus;
    contentRemoved: boolean;
    adminResponse: string | null;
    respondedAt: string | null;
    createdAt: string;
};

type ApiReportEntityType = "shop" | "product" | "service" | "user";

type ApiReport = {
    _id: string;
    reportCode?: string;
    entityType: ApiReportEntityType;
    entityTitle?: string | null;
    reason: ReportReason;
    details: string;
    status: ReportStatus;
    contentRemoved: boolean;
    adminResponse?: string | null;
    respondedAt?: string | null;
    createdAt: string;
    reporter?: { name?: string; email?: string };
};

type ReportsResponse = {
    data?: ApiReport[];
};

const ENTITY_TYPE_LABELS: Record<ApiReportEntityType, ContentType> = {
    shop: "Shop",
    product: "Listing",
    service: "Service",
    user: "User",
};

function mapApiReport(row: ApiReport): Report {
    return {
        id: row._id,
        reportCode: row.reportCode ?? "-",
        contentType: ENTITY_TYPE_LABELS[row.entityType] ?? "Listing",
        contentTitle: row.entityTitle ?? "-",
        reportedBy: row.reporter?.name ?? row.reporter?.email ?? "-",
        reason: row.reason,
        details: row.details,
        status: row.status,
        contentRemoved: row.contentRemoved,
        adminResponse: row.adminResponse ?? null,
        respondedAt: row.respondedAt ?? null,
        createdAt: row.createdAt,
    };
}

const REASON_META: Record<ReportReason, { bg: string; color: string }> = {
    Spam: { bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
    "Adult Content": { bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
    Fraud: { bg: "bg-[#F1E9FE]", color: "text-[#7C4FE0]" },
    Duplicate: { bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    Other: { bg: "bg-gray-10", color: "text-gray-8" },
};

const STATUS_META: Record<ReportStatus, { label: string; bg: string; color: string }> = {
    open: { label: "Open", bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
    closed: { label: "Closed", bg: "bg-green-4", color: "text-green-1" },
};

const REPORT_REASONS: ReportReason[] = ["Spam", "Adult Content", "Fraud", "Duplicate", "Other"];

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function AdminReports() {
    const { isSuperAdmin, has, canEdit } = useCurrentAdminPermissions();
    const canView = isSuperAdmin || has("reports");
    const canManage = isSuperAdmin || canEdit("reports");

    const [viewingReportId, setViewingReportId] = useState<string | null>(null);
    const [responseInput, setResponseInput] = useState("");
    const modalRef = useRef<HTMLDivElement>(null);

    const { data: reportsResponse, isLoading } = useGetAllReportsForAdminQuery(
        { page: 1, limit: 200 },
        { skip: !canView },
    );
    const reports = ((reportsResponse as ReportsResponse | undefined)?.data ?? []).map(mapApiReport);

    const [closeReport, { isLoading: isClosing }] = useCloseReportMutation();
    const [removeReportedContent, { isLoading: isRemoving }] = useRemoveReportedContentMutation();
    const [respondToReport, { isLoading: isResponding }] = useRespondToReportMutation();

    const viewingReport = reports.find((report) => report.id === viewingReportId) ?? null;
    const isModalOpen = Boolean(viewingReport);

    const analytics = useMemo(() => {
        const total = reports.length;
        const open = reports.filter((report) => report.status === "open").length;
        const closed = reports.filter((report) => report.status === "closed").length;
        const contentRemoved = reports.filter((report) => report.contentRemoved).length;
        const byReason = REPORT_REASONS.map((reason) => ({
            reason,
            count: reports.filter((report) => report.reason === reason).length,
        }));
        return { total, open, closed, contentRemoved, byReason };
    }, [reports]);

    function openReportModal(reportId: string) {
        const target = reports.find((report) => report.id === reportId);
        setResponseInput(target?.adminResponse ?? "");
        setViewingReportId(reportId);
    }

    function handleSetModalOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isModalOpen) : value;
        if (!nextOpen) {
            setViewingReportId(null);
        }
    }

    async function handleCloseReport(reportId: string) {
        try {
            await closeReport({ id: reportId }).unwrap();
            toast.success("Report closed");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleRemoveContent(reportId: string) {
        try {
            await removeReportedContent({ id: reportId }).unwrap();
            toast.success("Content marked as removed");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleSendResponse(reportId: string) {
        const trimmed = responseInput.trim();
        if (!trimmed) return;
        try {
            await respondToReport({ id: reportId, response: trimmed }).unwrap();
            toast.success("Response sent");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    if (!canView) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    You don&apos;t have permission to view Reports.
                </p>
            </section>
        );
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-7">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <Flag className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Reports
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Review user-submitted reports and take action on reported content
                    </p>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto pt-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3 rounded-[12px] border border-gray-9 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F0FF]">
                                <Flag className="h-5 w-5 text-[#2F6FE4]" strokeWidth={2} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-normal text-gray-11">Total Reports</p>
                                <p className="text-[20px] font-semibold text-[#001907]">{analytics.total}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-[12px] border border-gray-9 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FDEAB8]">
                                <Clock className="h-5 w-5 text-[#946200]" strokeWidth={2} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-normal text-gray-11">Open Reports</p>
                                <p className="text-[20px] font-semibold text-[#001907]">{analytics.open}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-[12px] border border-gray-9 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-green-4">
                                <CheckCircle2 className="h-5 w-5 text-green-1" strokeWidth={2} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-normal text-gray-11">Closed Reports</p>
                                <p className="text-[20px] font-semibold text-[#001907]">{analytics.closed}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-[12px] border border-gray-9 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FDD5D5]">
                                <ShieldAlert className="h-5 w-5 text-[#E92440]" strokeWidth={2} />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-normal text-gray-11">Content Removed</p>
                                <p className="text-[20px] font-semibold text-[#001907]">{analytics.contentRemoved}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-[12px] border border-gray-9 p-4">
                        <p className="mb-3 text-[13px] font-medium text-gray-8">By Reason</p>
                        <div className="flex flex-wrap gap-2">
                            {analytics.byReason.map(({ reason, count }) => (
                                <span
                                    key={reason}
                                    className={`inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium ${REASON_META[reason].bg} ${REASON_META[reason].color}`}
                                >
                                    {reason}
                                    <span className="rounded-[4px] bg-white/60 px-1.5 text-[12px] font-semibold">
                                        {count}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container px-5 lg:px-10 mx-auto mt-6 pb-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[820px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Report ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Content
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Reason
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Reported By
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Date
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading &&
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!isLoading && reports.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-[14px] text-gray-11">
                                            No reports yet
                                        </td>
                                    </tr>
                                )}

                                {!isLoading &&
                                    reports.map((report) => {
                                        const reasonMeta = REASON_META[report.reason];
                                        const statusMeta = STATUS_META[report.status];

                                        return (
                                            <tr key={report.id} className="bg-white">
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {report.reportCode}
                                                </td>
                                                <td className="py-3.5 pr-4 text-[14px] text-[#001907]">
                                                    <p className="font-medium">{report.contentTitle}</p>
                                                    <p className="text-[12px] text-gray-11">
                                                        {report.contentType}
                                                        {report.contentRemoved && (
                                                            <span className="ml-1.5 text-[#E92440]">(removed)</span>
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${reasonMeta.bg} ${reasonMeta.color}`}
                                                    >
                                                        {report.reason}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {report.reportedBy}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {formatDateTime(report.createdAt)}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${statusMeta.bg} ${statusMeta.color}`}
                                                    >
                                                        {statusMeta.label}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openReportModal(report.id)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" strokeWidth={2} />
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
            </div>

            <Modal editModalRef={modalRef} open={isModalOpen} setOpen={handleSetModalOpen} centered>
                <div className="hide-scrollbar w-[92vw] max-w-[460px] rounded-[12px] bg-white p-6 shadow-xl">
                    {viewingReport && (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                                    <Flag className="h-5 w-5 text-green-1" strokeWidth={2} />
                                    Report Reason
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setViewingReportId(null)}
                                    aria-label="Close"
                                    className="inline-flex h-8 w-8 items-center justify-center"
                                >
                                    <XMarkIcon className="h-5 w-5 text-[#001907]" />
                                </button>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Reported Content
                                    </p>
                                    <p className="mt-1 text-[14px] font-medium text-[#001907]">
                                        {viewingReport.contentTitle}
                                    </p>
                                    <p className="text-[12px] text-gray-11">
                                        {viewingReport.contentType}
                                        {viewingReport.contentRemoved && (
                                            <span className="ml-1.5 text-[#E92440]">(removed)</span>
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Reason
                                    </p>
                                    <span
                                        className={`mt-1 inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${REASON_META[viewingReport.reason].bg} ${REASON_META[viewingReport.reason].color}`}
                                    >
                                        {viewingReport.reason}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Details
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">{viewingReport.details}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                            Reported By
                                        </p>
                                        <p className="mt-1 text-[14px] text-[#001907]">{viewingReport.reportedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                            Date
                                        </p>
                                        <p className="mt-1 text-[14px] text-[#001907]">
                                            {formatDateTime(viewingReport.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Status
                                    </p>
                                    <span
                                        className={`mt-1 inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${STATUS_META[viewingReport.status].bg} ${STATUS_META[viewingReport.status].color}`}
                                    >
                                        {STATUS_META[viewingReport.status].label}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Response to reporter
                                    </p>
                                    {viewingReport.adminResponse && (
                                        <div className="mt-1.5 rounded-[8px] bg-gray-10 p-2.5">
                                            <p className="text-[13px] text-[#001907]">{viewingReport.adminResponse}</p>
                                            {viewingReport.respondedAt && (
                                                <p className="mt-1 text-[11px] text-gray-11">
                                                    Sent {formatDateTime(viewingReport.respondedAt)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <textarea
                                        value={responseInput}
                                        onChange={(e) => setResponseInput(e.target.value)}
                                        disabled={!canManage}
                                        rows={3}
                                        maxLength={1000}
                                        placeholder="Write a response the reporter will see on their My Reports page..."
                                        className="mt-2 w-full resize-none rounded-[8px] border border-gray-9 bg-white p-2.5 text-[13px] text-[#001907] outline-none focus:border-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => void handleSendResponse(viewingReport.id)}
                                            disabled={!canManage || isResponding || !responseInput.trim()}
                                            className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-green-1 px-3 text-[13px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {isResponding ? (
                                                <BeatLoader color="#00A651" size={6} />
                                            ) : (
                                                <>
                                                    <Send className="h-3.5 w-3.5" strokeWidth={2} />
                                                    Send Response
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => void handleRemoveContent(viewingReport.id)}
                                    disabled={!canManage || viewingReport.contentRemoved || isRemoving}
                                    className="inline-flex h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#E92440] px-4 text-[14px] font-medium text-[#E92440] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isRemoving ? (
                                        <BeatLoader color="#E92440" size={6} />
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                                            Remove Content
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleCloseReport(viewingReport.id)}
                                    disabled={!canManage || viewingReport.status === "closed" || isClosing}
                                    className="inline-flex h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isClosing ? (
                                        <BeatLoader color="white" size={6} />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                                            Close Report
                                        </>
                                    )}
                                </button>
                            </div>

                            {!canManage && (
                                <p className="mt-3 text-[12px] text-gray-11">
                                    You don&apos;t have permission to manage reports.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </section>
    );
}

export default AdminReports;
