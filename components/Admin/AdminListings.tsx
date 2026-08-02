"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Eye, Trash2 } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import ListingDetailModal from "@/components/Admin/ListingDetailModal";
import {
    useDeleteProductMutation,
    useGetAllProductsForAdminQuery,
    useLazyGetAllProductsForAdminQuery,
} from "@/store/services/adminService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import { downloadCsv, csvText } from "@/utils/downloadCsv";
import searchIcon from "@/assets/icons/searchIcon.svg";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type AdminListing = {
    id: string;
    listingCode: string;
    title: string;
    image?: string;
    category: string;
    price: number;
    createdAt: string;
};

type ApiAdminListing = {
    _id?: string;
    id?: string;
    listingCode?: string;
    title?: string;
    images?: string[];
    category?: { name?: { en?: string; ur?: string } } | string;
    price?: number;
    createdAt?: string;
};

type AdminListingsResponse = {
    data?: {
        items?: ApiAdminListing[];
    };
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function mapApiListing(product: ApiAdminListing): AdminListing {
    const createdAt = product.createdAt
        ? new Date(product.createdAt).toISOString().slice(0, 10)
        : "-";

    return {
        id: product._id ?? product.id ?? "",
        listingCode: product.listingCode ?? "-",
        title: product.title ?? "-",
        image: product.images?.[0],
        category: getFeedCategoryLabel(product.category ?? "", "en") || "-",
        price: product.price ?? 0,
        createdAt,
    };
}

function AdminListings() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [viewingProductId, setViewingProductId] = useState<string | null>(null);
    const [deletingListing, setDeletingListing] = useState<AdminListing | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: listingsResponse,
        isLoading,
        isFetching,
    } = useGetAllProductsForAdminQuery({ page, limit: PAGE_LIMIT, search });

    const [deleteProduct] = useDeleteProductMutation();
    const [triggerExport, { isFetching: isExporting }] = useLazyGetAllProductsForAdminQuery();

    const listings = (
        (listingsResponse as AdminListingsResponse | undefined)?.data?.items ?? []
    ).map(mapApiListing);

    const totalListings =
        parsePositiveInt((listingsResponse as AdminListingsResponse | undefined)?.meta?.total) ??
        listings.length;

    const pageCount =
        parsePositiveInt((listingsResponse as AdminListingsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalListings / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    async function handleExportCsv() {
        try {
            const response = await triggerExport({
                page: 1,
                limit: totalListings > 0 ? totalListings : 100000,
                search,
            }).unwrap();
            const rows = (
                (response as AdminListingsResponse)?.data?.items ?? []
            ).map(mapApiListing);
            if (rows.length === 0) {
                toast.error("No listings to export");
                return;
            }
            downloadCsv(
                `listings-${new Date().toISOString().slice(0, 10)}.csv`,
                ["Listing ID", "Title", "Category", "Price", "Created Date"],
                rows.map((listing) => [
                    listing.listingCode,
                    listing.title,
                    listing.category,
                    listing.price,
                    csvText(listing.createdAt),
                ]),
            );
        } catch {
            toast.error("Failed to export listings");
        }
    }

    function closeDeleteModal() {
        if (isDeleting) return;
        setDeletingListing(null);
    }

    async function handleConfirmDelete() {
        if (!deletingListing) return;

        setIsDeleting(true);
        try {
            const response = await deleteProduct(deletingListing.id).unwrap();
            toast.success(response.message ?? "Listing deleted successfully");
            setDeletingListing(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <section>
            <ListingDetailModal
                productId={viewingProductId}
                onClose={() => setViewingProductId(null)}
            />

            <Modal
                editModalRef={deleteModalRef}
                open={Boolean(deletingListing)}
                setOpen={(value) => {
                    const nextOpen = typeof value === "function" ? value(Boolean(deletingListing)) : value;
                    if (!nextOpen) closeDeleteModal();
                }}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">Delete listing</h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-[#001907]">{deletingListing?.title}</span>?
                        This cannot be undone from the admin panel.
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
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

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Listing Management
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage all product listings across the marketplace
                    </p>
                    <p className="mt-1 text-[11px] font-normal text-gray-6">
                        Note: disabled/deleted listings aren&apos;t shown in this list — that requires
                        a backend change that hasn&apos;t been made.
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
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by listing name or ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={isExporting}
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 bg-white px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isExporting ? (
                            <BeatLoader size={6} color="#007781" />
                        ) : (
                            <>
                                <Download className="h-4 w-4" strokeWidth={2} />
                                Export CSV
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Listing ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Listing
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Category
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Price
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Created Date
                                    </th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Actions
                                    </th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Moderation
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && listings.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No listings found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    listings.map((listing) => (
                                        <tr key={listing.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {listing.listingCode}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    {listing.image ? (
                                                        <Image
                                                            src={listing.image}
                                                            unoptimized
                                                            alt=""
                                                            height={32}
                                                            width={32}
                                                            className="h-8 w-8 shrink-0 rounded-[6px] object-cover"
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={noImageIcon}
                                                            alt=""
                                                            className="h-8 w-8 shrink-0 rounded-[6px] object-cover"
                                                        />
                                                    )}
                                                    <span className="whitespace-nowrap text-[14px] font-normal text-[#001907]">
                                                        {listing.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 text-[14px] font-normal capitalize text-gray-11">
                                                {listing.category}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                Rs. {listing.price.toLocaleString()}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {listing.createdAt}
                                            </td>
                                            <td className="py-3.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        aria-label="View listing details"
                                                        onClick={() => setViewingProductId(listing.id)}
                                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-gray-11 transition-colors hover:bg-green-4 hover:text-green-1"
                                                    >
                                                        <Eye className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label="Delete listing"
                                                        onClick={() => setDeletingListing(listing)}
                                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-gray-11 transition-colors hover:bg-[#FDD5D5] hover:text-red-1"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-[4px] bg-gray-10 px-2 py-1 text-[11px] font-medium text-gray-6">
                                                    Approve · Reject — soon
                                                </span>
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

export default AdminListings;
