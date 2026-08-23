"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Star } from "lucide-react";
import { useGetAllReviewsForAdminQuery } from "@/store/services/adminService";
import Pagination from "@/components/Ui/Pagination";
import searchIcon from "@/assets/icons/searchIcon.svg";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

type ItemTypeFilter = "" | "product" | "service";

const ITEM_TYPE_OPTIONS: { value: ItemTypeFilter; label: string }[] = [
    { value: "", label: "All Types" },
    { value: "product", label: "Product (Shop Listing)" },
    { value: "service", label: "Service" },
];

type ReviewRow = {
    _id: string;
    itemType: "product" | "service";
    itemTitle?: string;
    requestId?: string;
    rating: number;
    comment?: string;
    isFlagged?: boolean;
    createdAt?: string;
    reviewer?: { _id?: string; name?: string; email?: string };
};

type ReviewsResponse = {
    data?: ReviewRow[];
    meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < rating ? "fill-[#FFB03A] text-[#FFB03A]" : "text-gray-9"}`}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

function AdminReviews() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [itemType, setItemType] = useState<ItemTypeFilter>("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [itemType]);

    const { data, isLoading, isFetching } = useGetAllReviewsForAdminQuery({
        page,
        limit: PAGE_LIMIT,
        itemType: itemType || undefined,
        search,
    });
    const response = data as ReviewsResponse | undefined;
    const rows = useMemo(() => response?.data ?? [], [response]);
    const loading = isLoading || isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <Star className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Reviews
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Every review across Products and Services, with the booking it belongs to
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
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by reviewer, item, or comment..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={itemType}
                            onChange={(e) => setItemType(e.target.value as ItemTypeFilter)}
                            className="h-10 min-w-[220px] appearance-none rounded-[8px] border border-gray-9 bg-white pl-3 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {ITEM_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Reviewer</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Type</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Item</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Booking ID</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Rating</th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">Comment</th>
                                    <th className="py-3 text-[14px] font-medium text-[#001907]">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={`sk-${i}`}>
                                            {Array.from({ length: 7 }).map((__, c) => (
                                                <td key={c} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-[14px] text-gray-11">
                                            No reviews found
                                        </td>
                                    </tr>
                                )}
                                {!loading &&
                                    rows.map((row) => (
                                        <tr key={row._id} className="border-t border-gray-10 align-top">
                                            <td className="py-3.5 pr-4">
                                                <p className="text-[14px] font-normal text-[#001907]">
                                                    {row.reviewer?.name ?? "-"}
                                                </p>
                                                <p className="text-[12px] text-gray-11">{row.reviewer?.email ?? "-"}</p>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <span className="rounded-[4px] bg-gray-10 px-2 py-0.5 text-[12px] font-medium capitalize text-gray-8">
                                                    {row.itemType}
                                                </span>
                                            </td>
                                            <td className="max-w-[180px] py-3.5 pr-4 text-[13px] text-[#001907]">
                                                <span className="line-clamp-2">{row.itemTitle ?? "-"}</span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-11">
                                                {row.requestId ?? "-"}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <RatingStars rating={row.rating} />
                                            </td>
                                            <td className="max-w-[260px] py-3.5 pr-4 text-[13px] text-gray-11">
                                                <span className="line-clamp-2">{row.comment || "-"}</span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 text-[13px] text-gray-11">
                                                {fmtDateTime(row.createdAt)}
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

export default AdminReviews;
