"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Eye, Plus } from "lucide-react";
import { useGetWithdrawalsQuery } from "@/store/services/adminService";
import Pagination from "@/components/Ui/Pagination";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";
import DoodleButton from "@/components/Ui/DoodleButton";
import CreateWithdrawalModal from "@/components/Admin/CreateWithdrawalModal";
import WithdrawalDetailModal from "@/components/Admin/WithdrawalDetailModal";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import { formatMoneyMinor } from "@/utils/formatMoney";
import searchIcon from "@/assets/icons/searchIcon.svg";
import type { PaginatedResponse, WithdrawalRow } from "@/store/services/walletTypes";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;
const STATUS_OPTIONS = ["", "pending", "approved", "processing", "completed", "rejected", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-[#FDEAB8] text-[#946200]",
    approved: "bg-[#E7F0FF] text-[#2F6FE4]",
    processing: "bg-[#F1E9FE] text-[#7C4FE0]",
    completed: "bg-green-4 text-green-1",
    rejected: "bg-[#FDD5D5] text-[#E92440]",
    cancelled: "bg-gray-10 text-gray-8",
};

function refName(ref: WithdrawalRow["merchantId"]) {
    if (!ref) return "-";
    if (typeof ref === "string") return ref;
    return ref.name ?? ref.email ?? "-";
}

function fmtDate(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
}

function AdminWithdrawals() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [viewingId, setViewingId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [status, dateFilter, customStartDate, customEndDate]);

    const { startDate, endDate } = getDateRangeForFilter(dateFilter, customStartDate, customEndDate);

    const { data, isLoading, isFetching } = useGetWithdrawalsQuery({
        page,
        limit: PAGE_LIMIT,
        search,
        status: status || undefined,
        startDate,
        endDate,
    });
    const response = data as PaginatedResponse<WithdrawalRow> | undefined;
    const rows = useMemo(() => response?.data ?? [], [response]);
    const loading = isLoading || isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    return (
        <section>
            <CreateWithdrawalModal open={createOpen} onClose={() => setCreateOpen(false)} />
            <WithdrawalDetailModal withdrawalId={viewingId} onClose={() => setViewingId(null)} />

            <div className="bg-[#F6F8FA] pt-6 pb-5">
                <div className="container mx-auto flex flex-wrap items-start justify-between gap-3 px-5 lg:px-10">
                    <p className="text-[13px] font-normal text-gray-11">
                        Full withdrawal management — Fazl&apos;s platform fee is always 0%
                    </p>
                    <DoodleButton
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white"
                    >
                        <Plus className="h-4 w-4" /> Record Request
                    </DoodleButton>
                </div>

                <div className="container mx-auto mt-4 flex flex-wrap items-center justify-between gap-3 px-5 lg:px-10">
                    <div className="relative max-w-[280px] flex-1">
                        <Image
                            src={searchIcon}
                            alt=""
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by withdrawal ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 min-w-[150px] appearance-none rounded-[8px] border border-gray-9 bg-white pl-3 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s === "" ? "All Statuses" : s}
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
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Withdrawal ID</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Merchant</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Amount</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Method</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Status</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Request Date</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 8 }).map((_, i) => (
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
                                            No withdrawals found
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    rows.map((w) => (
                                        <tr key={w._id} className="border-t border-gray-10">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[13px] text-gray-11">
                                                {w.withdrawalCode ?? w._id}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[13px] text-[#001907]">
                                                {refName(w.merchantId)}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[13px] text-[#001907]">
                                                {formatMoneyMinor(w.requestedAmountMinor)}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[13px] text-gray-11">
                                                {w.withdrawalMethod}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <span
                                                    className={`rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${STATUS_COLORS[w.status] ?? "bg-gray-10 text-gray-8"
                                                        }`}
                                                >
                                                    {w.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[13px] text-gray-11">
                                                {fmtDate((w as unknown as { createdAt?: string }).createdAt)}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingId(w._id)}
                                                    className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
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

export default AdminWithdrawals;
