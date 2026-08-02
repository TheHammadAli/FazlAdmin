"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { Download, Eye } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import ShopDetailModal from "@/components/Admin/ShopDetailModal";
import {
    useGetAllShopsFromAdminQuery,
    useLazyGetAllShopsFromAdminQuery,
    useDisableShopMutation,
    useEnableShopMutation,
} from "@/store/services/adminService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { downloadCsv, csvText } from "@/utils/downloadCsv";
import searchIcon from "@/assets/icons/searchIcon.svg";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type ShopStatus = "active" | "suspended";

type AdminShop = {
    id: string;
    shopCode: string;
    title: string;
    image?: string;
    address: string;
    marketName: string;
    city: string;
    area: string;
    contact: string;
    openingHours: string;
    createdAt: string;
    status: ShopStatus;
};

type ApiAdminShop = {
    _id?: string;
    id?: string;
    shopCode?: string;
    title?: string;
    image?: string;
    address?: string;
    marketName?: string;
    city?: string;
    area?: string;
    contact?: string;
    openingHours?: string;
    createdAt?: string;
    isDisabled?: boolean;
};

type AdminShopsResponse = {
    data?: ApiAdminShop[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

const STATUS_STYLES: Record<ShopStatus, { label: string; className: string }> = {
    active: {
        label: "Active",
        className: "bg-[#CEF4CF] text-[#0F172A]",
    },
    suspended: {
        label: "Suspended",
        className: "bg-[#FDD5D5] text-[#0F172A]",
    },
};

function mapApiShop(shop: ApiAdminShop): AdminShop {
    const createdAt = shop.createdAt
        ? new Date(shop.createdAt).toISOString().slice(0, 10)
        : "-";

    return {
        id: shop._id ?? shop.id ?? "",
        shopCode: shop.shopCode ?? "-",
        title: shop.title ?? "-",
        image: shop.image,
        address: shop.address ?? "-",
        marketName: shop.marketName ?? "-",
        city: shop.city ?? "-",
        area: shop.area ?? "-",
        contact: shop.contact ?? "-",
        openingHours: shop.openingHours ?? "-",
        createdAt,
        status: shop.isDisabled ? "suspended" : "active",
    };
}

type PendingStatusChange = {
    shop: AdminShop;
    action: "disable" | "enable";
};

function AdminShops() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [viewingShopId, setViewingShopId] = useState<string | null>(null);
    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const statusModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: shopsResponse,
        isLoading,
        isFetching,
    } = useGetAllShopsFromAdminQuery({ page, limit: PAGE_LIMIT, search });

    const [disableShop, { isLoading: isDisabling }] = useDisableShopMutation();
    const [enableShop, { isLoading: isEnabling }] = useEnableShopMutation();
    const isChangingStatus = isDisabling || isEnabling;
    const [triggerExport, { isFetching: isExporting }] = useLazyGetAllShopsFromAdminQuery();

    const shops = ((shopsResponse as AdminShopsResponse | undefined)?.data ?? []).map(mapApiShop);

    const totalShops =
        parsePositiveInt((shopsResponse as AdminShopsResponse | undefined)?.meta?.total) ??
        shops.length;

    async function handleExportCsv() {
        try {
            const response = await triggerExport({
                page: 1,
                limit: totalShops > 0 ? totalShops : 100000,
                search,
            }).unwrap();
            const rows = ((response as AdminShopsResponse)?.data ?? []).map(mapApiShop);
            if (rows.length === 0) {
                toast.error("No shops to export");
                return;
            }
            downloadCsv(
                `shops-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                    "Shop ID",
                    "Shop Name",
                    "Market Name",
                    "Address",
                    "City",
                    "Area",
                    "Contact",
                    "Opening Hours",
                    "Status",
                    "Created Date",
                ],
                rows.map((shop) => [
                    shop.shopCode,
                    shop.title,
                    shop.marketName,
                    shop.address,
                    shop.city,
                    shop.area,
                    csvText(shop.contact),
                    shop.openingHours,
                    STATUS_STYLES[shop.status].label,
                    csvText(shop.createdAt),
                ]),
            );
        } catch {
            toast.error("Failed to export shops");
        }
    }

    const pageCount =
        parsePositiveInt((shopsResponse as AdminShopsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalShops / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    async function handleStatusChange(shop: AdminShop, action: "disable" | "enable") {
        try {
            const response =
                action === "disable"
                    ? await disableShop(shop.id).unwrap()
                    : await enableShop(shop.id).unwrap();

            toast.success((response as { message?: string })?.message ?? "Shop status updated");

            setIsStatusModalOpen(false);
            setPendingStatusChange(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    function openStatusModal(shop: AdminShop) {
        setPendingStatusChange({
            shop,
            action: shop.status === "active" ? "disable" : "enable",
        });
        setIsStatusModalOpen(true);
    }

    function closeStatusModal() {
        if (isChangingStatus) return;
        setIsStatusModalOpen(false);
        setPendingStatusChange(null);
    }

    useEffect(() => {
        if (!isStatusModalOpen && !isChangingStatus) {
            setPendingStatusChange(null);
        }
    }, [isStatusModalOpen, isChangingStatus]);

    return (
        <section>
            <ShopDetailModal shopId={viewingShopId} onClose={() => setViewingShopId(null)} />

            <Modal
                editModalRef={statusModalRef}
                open={isStatusModalOpen}
                setOpen={setIsStatusModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingStatusChange?.action === "enable" ? "Enable shop" : "Suspend shop"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to {pendingStatusChange?.action === "enable" ? "enable" : "suspend"}{" "}
                        <span className="font-medium text-[#001907]">
                            {pendingStatusChange?.shop.title}
                        </span>
                        ?
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeStatusModal}
                            disabled={isChangingStatus}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        {pendingStatusChange?.action === "enable" ? (
                            <button
                                type="button"
                                disabled={isChangingStatus}
                                onClick={() => {
                                    if (!pendingStatusChange) return;
                                    handleStatusChange(pendingStatusChange.shop, pendingStatusChange.action);
                                }}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isChangingStatus ? <BeatLoader color="white" size={8} /> : "Confirm"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={isChangingStatus}
                                onClick={() => {
                                    if (!pendingStatusChange) return;
                                    handleStatusChange(pendingStatusChange.shop, pendingStatusChange.action);
                                }}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isChangingStatus ? <BeatLoader color="white" size={8} /> : "Confirm"}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Shop Management
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage all shops registered on the marketplace
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
                            placeholder="Search by shop name or ID..."
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
                                        Shop ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Shop
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Address
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Created Date
                                    </th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && shops.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No shops found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    shops.map((shop) => {
                                        const statusStyle = STATUS_STYLES[shop.status];

                                        return (
                                            <tr key={shop.id} className="bg-white">
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {shop.shopCode}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        {shop.image ? (
                                                            <Image
                                                                src={shop.image}
                                                                unoptimized
                                                                alt=""
                                                                height={32}
                                                                width={32}
                                                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={noImageIcon}
                                                                alt=""
                                                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                            />
                                                        )}
                                                        <span className="whitespace-nowrap text-[14px] font-normal text-[#001907]">
                                                            {shop.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {shop.address}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <ToggleSwitch
                                                            checked={shop.status === "active"}
                                                            disabled={isChangingStatus}
                                                            ariaLabel={
                                                                shop.status === "active"
                                                                    ? `Suspend ${shop.title}`
                                                                    : `Enable ${shop.title}`
                                                            }
                                                            onChange={() => openStatusModal(shop)}
                                                        />
                                                        <span
                                                            className={`inline-flex whitespace-nowrap rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${statusStyle.className}`}
                                                        >
                                                            {statusStyle.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {shop.createdAt}
                                                </td>
                                                <td className="py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingShopId(shop.id)}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
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

export default AdminShops;
