"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useGetWalletAuditLogQuery } from "@/store/services/adminService";
import Pagination from "@/components/Ui/Pagination";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import type { PaginatedResponse, WalletAuditLogRow } from "@/store/services/walletTypes";

const PAGE_LIMIT = 25;

const ACTION_OPTIONS = [
    "",
    "manual_balance_addition",
    "manual_balance_deduction",
    "wallet_freeze",
    "wallet_unfreeze",
    "refund",
    "refund_rejection",
    "withdrawal_created",
    "withdrawal_approval",
    "withdrawal_rejection",
    "withdrawal_status_change",
    "withdrawal_cancelled",
    "deal_change",
    "wallet_settings_change",
    "wallet_recalculated",
];

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function fmtValue(v?: Record<string, unknown> | null) {
    if (!v) return "-";
    try {
        return JSON.stringify(v);
    } catch {
        return "-";
    }
}

function AdminWalletAuditLog() {
    const [page, setPage] = useState(1);
    const [action, setAction] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    useEffect(() => {
        setPage(1);
    }, [action, dateFilter, customStartDate, customEndDate]);

    const { startDate, endDate } = getDateRangeForFilter(dateFilter, customStartDate, customEndDate);

    const { data, isLoading, isFetching } = useGetWalletAuditLogQuery({
        page,
        limit: PAGE_LIMIT,
        action: action || undefined,
        startDate,
        endDate,
    });
    const response = data as PaginatedResponse<WalletAuditLogRow> | undefined;
    const rows = useMemo(() => response?.data ?? [], [response]);
    const loading = isLoading || isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-6 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <p className="text-[13px] font-normal text-gray-11">
                        Every wallet admin action — old value, new value, and reason
                    </p>
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center justify-end gap-3 px-5 lg:px-10">
                    <div className="relative">
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="h-10 min-w-[200px] appearance-none rounded-[8px] border border-gray-9 bg-white pl-3 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {ACTION_OPTIONS.map((a) => (
                                <option key={a} value={a}>
                                    {a === "" ? "All Actions" : a.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                    </div>
                    <DateRangeFilter
                        value={dateFilter}
                        onChange={setDateFilter}
                        startDate={customStartDate}
                        endDate={customEndDate}
                        onStartDateChange={setCustomStartDate}
                        onEndDateChange={setCustomEndDate}
                    />
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Date &amp; Time</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Admin</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Action</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Subject</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Old Value</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">New Value</th>
                                    <th className="py-3 text-[14px] font-medium text-[#001907]">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={`sk-${i}`}>
                                            {Array.from({ length: 7 }).map((__, c) => (
                                                <td key={c} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[130px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-[14px] text-gray-11">
                                            No audit log entries found
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    rows.map((log) => (
                                        <tr key={log._id} className="border-t border-gray-10 align-top">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-11">
                                                {fmtDateTime(log.createdAt)}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-[#001907]">
                                                {log.adminInfo?.name ?? log.adminInfo?.email ?? "-"}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <span className="rounded-[4px] bg-gray-10 px-2 py-0.5 text-[11px] font-medium text-gray-8">
                                                    {log.action.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-[#001907]">
                                                {log.subjectInfo?.name ?? log.subjectInfo?.email ?? "-"}
                                            </td>
                                            <td className="max-w-[180px] truncate py-3.5 pr-4 text-[11px] text-gray-11" title={fmtValue(log.oldValue)}>
                                                {fmtValue(log.oldValue)}
                                            </td>
                                            <td className="max-w-[180px] truncate py-3.5 pr-4 text-[11px] text-gray-11" title={fmtValue(log.newValue)}>
                                                {fmtValue(log.newValue)}
                                            </td>
                                            <td className="max-w-[180px] truncate py-3.5 text-[12px] text-gray-11" title={log.reason ?? ""}>
                                                {log.reason ?? "-"}
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

export default AdminWalletAuditLog;
