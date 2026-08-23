"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Eye, Snowflake } from "lucide-react";
import { useGetUserWalletsQuery } from "@/store/services/adminService";
import Pagination from "@/components/Ui/Pagination";
import WalletDetailModal from "@/components/Admin/WalletDetailModal";
import { formatMoneyMinor } from "@/utils/formatMoney";
import searchIcon from "@/assets/icons/searchIcon.svg";
import type { PaginatedResponse, WalletListRow } from "@/store/services/walletTypes";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

function getInitials(name?: string) {
    if (!name) return "-";
    return name.split(" ").map((p) => p.charAt(0)).join("").slice(0, 2).toUpperCase();
}

function AdminUserWallets() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading, isFetching } = useGetUserWalletsQuery({ page, limit: PAGE_LIMIT, search });
    const response = data as PaginatedResponse<WalletListRow> | undefined;
    const rows = useMemo(() => response?.data ?? [], [response]);
    const loading = isLoading || isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    return (
        <section>
            <WalletDetailModal ownerId={viewingUserId} walletType="user" onClose={() => setViewingUserId(null)} />

            <div className="bg-[#F6F8FA] pt-6 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <p className="text-[13px] font-normal text-gray-11">
                        Search users, view balances and complete transaction history
                    </p>
                </div>

                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="relative max-w-[320px]">
                        <Image
                            src={searchIcon}
                            alt=""
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by name, email, phone, or ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">User</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Available Balance</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Pending Balance</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Status</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">Wallet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={`sk-${i}`}>
                                            {Array.from({ length: 5 }).map((__, c) => (
                                                <td key={c} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-[14px] text-gray-11">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    rows.map((row) => {
                                        const id = row._id ?? row.id ?? "";
                                        return (
                                            <tr key={id} className="border-t border-gray-10">
                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB] text-[11px] font-medium text-[#030303]">
                                                            {getInitials(row.name)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[14px] font-normal text-[#001907]">{row.name}</p>
                                                            <p className="truncate text-[12px] text-gray-11">{row.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] text-gray-11">
                                                    {row.wallet ? formatMoneyMinor(row.wallet.availableBalanceMinor) : "-"}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] text-gray-11">
                                                    {row.wallet ? formatMoneyMinor(row.wallet.pendingBalanceMinor) : "-"}
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4">
                                                    {!row.wallet ? (
                                                        <span className="text-[12px] text-gray-11">No wallet yet</span>
                                                    ) : row.wallet.isFrozen ? (
                                                        <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#FDD5D5] px-2 py-0.5 text-[12px] font-medium text-[#E92440]">
                                                            <Snowflake className="h-3 w-3" /> Frozen
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-[4px] bg-green-4 px-2 py-0.5 text-[12px] font-medium text-green-1">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingUserId(id)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
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

export default AdminUserWallets;
