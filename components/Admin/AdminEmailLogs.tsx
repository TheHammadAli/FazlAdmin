"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import { useGetAllEmailLogsQuery, useGetEmailLogStatsQuery } from "@/store/services/adminService";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import searchIcon from "@/assets/icons/searchIcon.svg";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 20;

type EventType =
    | "shop_created"
    | "listing_created"
    | "service_created"
    | "booking_accepted"
    | "broadcast_created";

type DeliveryStatus = "sent" | "failed";

const EVENT_META: Record<EventType, { label: string; bg: string; color: string }> = {
    shop_created: { label: "Shop Created", bg: "bg-green-4", color: "text-green-1" },
    listing_created: { label: "Listing Created", bg: "bg-[#F1E9FE]", color: "text-[#7C4FE0]" },
    service_created: { label: "Service Created", bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
    booking_accepted: { label: "Booking Accepted", bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    broadcast_created: { label: "Broadcast Created", bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
};

const STATUS_META: Record<DeliveryStatus, { label: string; bg: string; color: string }> = {
    sent: { label: "Sent", bg: "bg-green-4", color: "text-green-1" },
    failed: { label: "Failed", bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
};

const EVENT_FILTERS: { label: string; value: EventType | "" }[] = [
    { label: "All Events", value: "" },
    ...(Object.keys(EVENT_META) as EventType[]).map((value) => ({
        label: EVENT_META[value].label,
        value,
    })),
];

type ApiEmailLog = {
    _id?: string;
    emailId?: string;
    recipient?: string;
    relatedRecordId?: string;
    eventType?: string;
    deliveryStatus?: string;
    createdAt?: string;
};

type EmailLogsResponse = {
    data?: ApiEmailLog[];
    meta?: { total?: number | string; totalPages?: number | string };
};

type EmailLogStatsResponse = {
    data?: { total?: number; byEvent?: Record<string, number> };
};

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function AdminEmailLogs() {
    const { isSuperAdmin, has } = useCurrentAdminPermissions();
    const canView = isSuperAdmin || has("email-logs");

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [eventTypeFilter, setEventTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: statsResponse } = useGetEmailLogStatsQuery(undefined, { skip: !canView });
    const stats = (statsResponse as EmailLogStatsResponse | undefined)?.data;
    const statsByEvent = stats?.byEvent ?? {};

    const {
        data: logsResponse,
        isLoading,
        isFetching,
    } = useGetAllEmailLogsQuery(
        { page, limit: PAGE_LIMIT, search, eventType: eventTypeFilter, deliveryStatus: statusFilter },
        { skip: !canView },
    );

    const logs = (logsResponse as EmailLogsResponse | undefined)?.data ?? [];
    const totalLogs =
        parsePositiveInt((logsResponse as EmailLogsResponse | undefined)?.meta?.total) ?? logs.length;
    const pageCount =
        parsePositiveInt((logsResponse as EmailLogsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalLogs / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    function selectEventType(eventType: string) {
        setEventTypeFilter((prev) => (prev === eventType ? "" : eventType));
        setPage(1);
    }

    if (!canView) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    You don&apos;t have permission to view Email Logs.
                </p>
            </section>
        );
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <Mail className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Email Logs
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Every automatic email sent by the platform is recorded here
                    </p>
                </div>

                <div className="container mx-auto mt-5 grid grid-cols-2 gap-3 px-5 sm:grid-cols-3 lg:grid-cols-6 lg:px-10">
                    <button
                        type="button"
                        onClick={() => selectEventType("")}
                        className={`flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition-colors ${eventTypeFilter === ""
                            ? "border-green-1 bg-green-4"
                            : "border-gray-9 bg-white hover:border-green-1"
                            }`}
                    >
                        <span className="text-[12px] font-normal text-gray-11">Total Emails</span>
                        <span className="text-[18px] font-semibold text-[#001907]">{stats?.total ?? 0}</span>
                    </button>

                    {(Object.keys(EVENT_META) as EventType[]).map((eventType) => (
                        <button
                            key={eventType}
                            type="button"
                            onClick={() => selectEventType(eventType)}
                            className={`flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition-colors ${eventTypeFilter === eventType
                                ? "border-green-1 bg-green-4"
                                : "border-gray-9 bg-white hover:border-green-1"
                                }`}
                        >
                            <span className="truncate text-[12px] font-normal text-gray-11">
                                {EVENT_META[eventType].label}
                            </span>
                            <span className="text-[18px] font-semibold text-[#001907]">
                                {statsByEvent[eventType] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center gap-3 px-5 lg:px-10">
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
                            placeholder="Search by email ID, recipient, or record ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <select
                        value={eventTypeFilter}
                        onChange={(e) => {
                            setEventTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    >
                        {EVENT_FILTERS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    >
                        <option value="">All Statuses</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto pt-6 pb-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Email ID</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Recipient</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Related Record ID</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Event Type</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Delivery Status</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Date &amp; Time</th>
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

                                {!loading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-[14px] text-gray-11">
                                            No email logs yet
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    logs.map((log) => {
                                        const eventMeta = EVENT_META[log.eventType as EventType];
                                        const statusMeta = STATUS_META[log.deliveryStatus as DeliveryStatus];

                                        return (
                                            <tr key={log._id ?? log.emailId} className="bg-white">
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {log.emailId ?? "-"}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] text-[#001907]">
                                                    {log.recipient ?? "-"}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {log.relatedRecordId ?? "-"}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    {eventMeta ? (
                                                        <span
                                                            className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${eventMeta.bg} ${eventMeta.color}`}
                                                        >
                                                            {eventMeta.label}
                                                        </span>
                                                    ) : (
                                                        log.eventType ?? "-"
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    {statusMeta ? (
                                                        <span
                                                            className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${statusMeta.bg} ${statusMeta.color}`}
                                                        >
                                                            {statusMeta.label}
                                                        </span>
                                                    ) : (
                                                        log.deliveryStatus ?? "-"
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {formatDateTime(log.createdAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    {!loading && (
                        <Pagination
                            className="mt-4"
                            pageCount={pageCount}
                            currentPage={page}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

export default AdminEmailLogs;
