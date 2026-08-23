"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useGetMerchantWalletsQuery } from "@/store/services/adminService";
import Pagination from "@/components/Ui/Pagination";
import MerchantDealModal from "@/components/Admin/MerchantDealModal";
import searchIcon from "@/assets/icons/searchIcon.svg";
import type { PaginatedResponse, WalletListRow } from "@/store/services/walletTypes";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

function AdminMerchantDeals() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [dealMerchant, setDealMerchant] = useState<{ id: string; name?: string } | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading, isFetching } = useGetMerchantWalletsQuery({ page, limit: PAGE_LIMIT, search });
    const response = data as PaginatedResponse<WalletListRow> | undefined;
    const rows = useMemo(() => response?.data ?? [], [response]);
    const loading = isLoading || isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    return (
        <section>
            <MerchantDealModal
                merchantId={dealMerchant?.id ?? null}
                merchantName={dealMerchant?.name}
                onClose={() => setDealMerchant(null)}
            />

            <div className="bg-[#F6F8FA] pt-6 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <p className="text-[13px] font-normal text-gray-11">
                        Merchant Deal = Customer Discount + Fazl Margin. Changing a deal never alters past transactions.
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
                            placeholder="Search merchant by name, email, or ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Merchant</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Email</th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">Deal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={`sk-${i}`}>
                                            {Array.from({ length: 3 }).map((__, c) => (
                                                <td key={c} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-[14px] text-gray-11">
                                            No merchants found
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    rows.map((row) => {
                                        const id = row._id ?? row.id ?? "";
                                        return (
                                            <tr key={id} className="border-t border-gray-10">
                                                <td className="py-3.5 pr-4 text-[14px] font-normal text-[#001907]">{row.name}</td>
                                                <td className="py-3.5 pr-4 text-[14px] text-gray-11">{row.email}</td>
                                                <td className="py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDealMerchant({ id, name: row.name })}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        Manage Deal
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

export default AdminMerchantDeals;
