"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CheckCheck, CheckCircle2, Clock, Eye, XCircle } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import BookingDetailModal from "@/components/Admin/BookingDetailModal";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";
import {
    useGetAllServiceRequestsForAdminQuery,
    useGetServiceRequestStatsQuery,
} from "@/store/services/adminService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import searchIcon from "@/assets/icons/searchIcon.svg";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

export type BookingStatus = "pending" | "accepted" | "completed" | "cancelled";

const STATUS_BADGE_STYLES: Record<BookingStatus, string> = {
    pending: "bg-[#FFF6DD] text-[#946800]",
    accepted: "bg-green-4 text-green-1",
    completed: "bg-[#DFF3E6] text-[#0F7A3D]",
    cancelled: "bg-[#FDD5D5] text-[#C23652]",
};

const STAT_CARDS: {
    key: BookingStatus | "total";
    label: string;
    icon: LucideIcon;
    bg: string;
    color: string;
}[] = [
    { key: "total", label: "All Bookings", icon: CalendarCheck, bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    { key: "pending", label: "Pending", icon: Clock, bg: "bg-[#FFF6DD]", color: "text-[#946800]" },
    { key: "accepted", label: "Accepted", icon: CheckCircle2, bg: "bg-green-4", color: "text-green-1" },
    { key: "completed", label: "Completed", icon: CheckCheck, bg: "bg-[#DFF3E6]", color: "text-[#0F7A3D]" },
    { key: "cancelled", label: "Cancelled", icon: XCircle, bg: "bg-[#FDD5D5]", color: "text-[#C23652]" },
];

type BookingStats = {
    total?: number;
    pending?: number;
    accepted?: number;
    completed?: number;
    cancelled?: number;
};

type BookingStatsResponse = {
    data?: BookingStats;
};

type Booking = {
    id: string;
    jobCode: string;
    customerId: string;
    customerName: string;
    providerId: string;
    providerName: string;
    serviceId: string;
    serviceTitle: string;
    requestedDateTime: string;
    status: BookingStatus;
};

type ApiBooking = {
    _id?: string;
    jobCode?: string;
    customerInfo?: { _id?: string; name?: string };
    providerInfo?: { _id?: string; name?: string };
    serviceInfo?: { _id?: string; title?: string };
    requestedDateTime?: string;
    bookingStatus?: BookingStatus;
};

type BookingsResponse = {
    data?: ApiBooking[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function mapApiBooking(booking: ApiBooking): Booking {
    return {
        id: booking._id ?? "",
        jobCode: booking.jobCode ?? "-",
        customerId: booking.customerInfo?._id ?? "",
        customerName: booking.customerInfo?.name ?? "-",
        providerId: booking.providerInfo?._id ?? "",
        providerName: booking.providerInfo?.name ?? "-",
        serviceId: booking.serviceInfo?._id ?? "",
        serviceTitle: booking.serviceInfo?.title ?? "-",
        requestedDateTime: formatDateTime(booking.requestedDateTime),
        status: booking.bookingStatus ?? "pending",
    };
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function AdminBookings() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
    const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [viewingBookingId, setViewingBookingId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [dateFilter, customStartDate, customEndDate]);

    const { startDate, endDate } = getDateRangeForFilter(dateFilter, customStartDate, customEndDate);

    const {
        data: bookingsResponse,
        isLoading,
        isFetching,
    } = useGetAllServiceRequestsForAdminQuery({
        page,
        limit: PAGE_LIMIT,
        search,
        bookingStatus: statusFilter,
        startDate,
        endDate,
    });

    const { data: statsResponse, isLoading: isStatsLoading } = useGetServiceRequestStatsQuery(undefined);
    const stats = (statsResponse as BookingStatsResponse | undefined)?.data;

    function selectStatusFilter(value: BookingStatus | "") {
        setStatusFilter(value);
        setPage(1);
    }

    const bookings = ((bookingsResponse as BookingsResponse | undefined)?.data ?? []).map(
        mapApiBooking,
    );

    const totalBookings =
        parsePositiveInt((bookingsResponse as BookingsResponse | undefined)?.meta?.total) ??
        bookings.length;

    const pageCount =
        parsePositiveInt((bookingsResponse as BookingsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalBookings / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    return (
        <section>
            <BookingDetailModal
                requestId={viewingBookingId}
                onClose={() => setViewingBookingId(null)}
            />

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Service Bookings
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        View and manage all service bookings on the marketplace
                    </p>
                </div>

                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {STAT_CARDS.map((card) => {
                            const value = isStatsLoading
                                ? "..."
                                : String(stats?.[card.key === "total" ? "total" : card.key] ?? 0);
                            const isActive =
                                card.key === "total" ? statusFilter === "" : statusFilter === card.key;

                            return (
                                <button
                                    key={card.key}
                                    type="button"
                                    onClick={() => selectStatusFilter(card.key === "total" ? "" : card.key)}
                                    className={`flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 text-left transition-colors ${
                                        isActive
                                            ? "border-green-1 bg-green-4/40"
                                            : "border-gray-9 bg-white hover:border-green-1"
                                    }`}
                                >
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${card.bg}`}>
                                        <card.icon className={`h-4 w-4 ${card.color}`} strokeWidth={2} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[12px] font-normal text-gray-11">
                                            {card.label}
                                        </p>
                                        <p className="text-[18px] font-semibold text-[#001907]">{value}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
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
                            placeholder="Search by booking ID, customer, provider or service..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
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
                <div className="container px-5 lg:px-10 mx-auto mt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-[820px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Booking ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Customer
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Provider
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Service
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Requested Date
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
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
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && bookings.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No bookings found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    bookings.map((booking) => (
                                        <tr key={booking.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {booking.jobCode}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {booking.customerId ? (
                                                    <Link
                                                        href={`/admin/users?viewUserId=${booking.customerId}`}
                                                        className="text-green-1 hover:underline"
                                                    >
                                                        {booking.customerName}
                                                    </Link>
                                                ) : (
                                                    booking.customerName
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-[#001907]">
                                                {booking.providerId ? (
                                                    <Link
                                                        href={`/admin/users?viewUserId=${booking.providerId}`}
                                                        className="text-green-1 hover:underline"
                                                    >
                                                        {booking.providerName}
                                                    </Link>
                                                ) : (
                                                    booking.providerName
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {booking.serviceId ? (
                                                    <Link
                                                        href={`/admin/services?viewServiceId=${booking.serviceId}`}
                                                        className="text-green-1 hover:underline"
                                                    >
                                                        {booking.serviceTitle}
                                                    </Link>
                                                ) : (
                                                    booking.serviceTitle
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {booking.requestedDateTime}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-1 text-[12px] font-medium capitalize ${STATUS_BADGE_STYLES[booking.status]}`}
                                                >
                                                    {capitalize(booking.status)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingBookingId(booking.id)}
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

export default AdminBookings;
