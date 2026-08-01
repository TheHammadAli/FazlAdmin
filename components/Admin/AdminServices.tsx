"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import ServiceDetailModal from "@/components/Admin/ServiceDetailModal";
import { useGetAllServicesForAdminQuery } from "@/store/services/adminService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import searchIcon from "@/assets/icons/searchIcon.svg";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type PaymentType = "hourly" | "fixed" | "call_for_price";

type AdminService = {
    id: string;
    serviceCode: string;
    title: string;
    image?: string;
    category: string;
    price: number;
    paymentType: PaymentType;
    createdAt: string;
};

type ApiAdminService = {
    _id?: string;
    id?: string;
    serviceCode?: string;
    title?: string;
    images?: string[];
    category?: { name?: { en?: string; ur?: string } } | string;
    price?: number;
    paymentType?: PaymentType;
    createdAt?: string;
};

type AdminServicesResponse = {
    data?: ApiAdminService[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function mapApiService(service: ApiAdminService): AdminService {
    const createdAt = service.createdAt
        ? new Date(service.createdAt).toISOString().slice(0, 10)
        : "-";

    return {
        id: service._id ?? service.id ?? "",
        serviceCode: service.serviceCode ?? "-",
        title: service.title ?? "-",
        image: service.images?.[0],
        category: getFeedCategoryLabel(service.category ?? "", "en") || "-",
        price: service.price ?? 0,
        paymentType: service.paymentType ?? "fixed",
        createdAt,
    };
}

function formatPrice(price: number, paymentType: PaymentType) {
    if (paymentType === "call_for_price") {
        return "Call for price";
    }
    return `Rs. ${price.toLocaleString()}${paymentType === "hourly" ? " /hr" : ""}`;
}

function AdminServices() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [viewingServiceId, setViewingServiceId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const linkedServiceId = params.get("viewServiceId");
        if (linkedServiceId) {
            setViewingServiceId(linkedServiceId);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: servicesResponse,
        isLoading,
        isFetching,
    } = useGetAllServicesForAdminQuery({ page, limit: PAGE_LIMIT, search });

    const services = ((servicesResponse as AdminServicesResponse | undefined)?.data ?? []).map(
        mapApiService,
    );

    const totalServices =
        parsePositiveInt((servicesResponse as AdminServicesResponse | undefined)?.meta?.total) ??
        services.length;

    const pageCount =
        parsePositiveInt((servicesResponse as AdminServicesResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalServices / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    return (
        <section>
            <ServiceDetailModal
                serviceId={viewingServiceId}
                onClose={() => setViewingServiceId(null)}
            />

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Service Management
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage all services offered on the marketplace
                    </p>
                    <p className="mt-1 text-[11px] font-normal text-gray-6">
                        Note: suspended services aren&apos;t shown in this list yet — that requires a
                        backend change that hasn&apos;t been made.
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
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by service name or ID..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Service ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Service
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

                                {!loading && services.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No services found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    services.map((service) => (
                                        <tr key={service.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {service.serviceCode}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    {service.image ? (
                                                        <Image
                                                            src={service.image}
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
                                                        {service.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 text-[14px] font-normal capitalize text-gray-11">
                                                {service.category}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {formatPrice(service.price, service.paymentType)}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {service.createdAt}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingServiceId(service.id)}
                                                    className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View
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

export default AdminServices;
