"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
    Users,
    Store,
    ClipboardList,
    Wrench,
    CalendarCheck,
    Radio,
    Video,
    Clock,
    Flag,
    Mail,
    Tags,
    ChevronRight,
} from "lucide-react";
import {
    useGetAllUsersFromAdminQuery,
    useGetAllShopsFromAdminQuery,
    useGetAllServicesForAdminQuery,
    useGetAllProductsForAdminQuery,
    useGetServiceRequestStatsQuery,
    useGetAllBroadcastsForAdminQuery,
    useGetFeedVideosQuery,
    useGetAllCategoriesForAdminQuery,
} from "@/store/services/adminService";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";
import AdminProfileMenu from "@/components/Admin/AdminProfileMenu";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import buttonDoodleImage from "@/assets/images/button-doodle-image.svg";

type UsersResponse = {
    meta?: {
        total?: number | string;
    };
};

type ShopsResponse = {
    meta?: {
        total?: number | string;
    };
};

type ServicesResponse = {
    meta?: {
        total?: number | string;
    };
};

type BroadcastsResponse = {
    meta?: {
        total?: number | string;
    };
};

type FeedVideosResponse = {
    meta?: {
        total?: number | string;
    };
};

type ProductsResponse = {
    data?: {
        promotions?: unknown[];
    };
    meta?: {
        total?: number | string;
    };
};

type BookingStatsResponse = {
    data?: {
        total?: number;
    };
};

type CategoriesResponse = {
    data?: unknown[];
};

type StatCard = {
    label: string;
    value: string;
    icon: LucideIcon;
    bg: string;
    color: string;
    comingSoon?: boolean;
    href?: string;
};

function IconBadge({ icon: Icon, bg, color }: { icon: LucideIcon; bg: string; color: string }) {
    return (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} strokeWidth={2} />
        </span>
    );
}

function AdminDashboard() {
    const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const { startDate, endDate } = getDateRangeForFilter(dateFilter, customStartDate, customEndDate);

    const { data: usersResponse, isLoading, isFetching } = useGetAllUsersFromAdminQuery({
        page: 1,
        limit: 1,
        startDate,
        endDate,
    });

    const totalUsers = (usersResponse as UsersResponse | undefined)?.meta?.total;
    const loadingUsers = isLoading || isFetching;

    const {
        data: shopsResponse,
        isLoading: isShopsLoading,
        isFetching: isShopsFetching,
    } = useGetAllShopsFromAdminQuery({ page: 1, limit: 1, search: "", startDate, endDate });

    const totalShops = (shopsResponse as ShopsResponse | undefined)?.meta?.total;
    const loadingShops = isShopsLoading || isShopsFetching;

    const {
        data: servicesResponse,
        isLoading: isServicesLoading,
        isFetching: isServicesFetching,
    } = useGetAllServicesForAdminQuery({ page: 1, limit: 1, search: "", startDate, endDate });

    const totalServices = (servicesResponse as ServicesResponse | undefined)?.meta?.total;
    const loadingServices = isServicesLoading || isServicesFetching;

    const {
        data: productsResponse,
        isLoading: isProductsLoading,
        isFetching: isProductsFetching,
    } = useGetAllProductsForAdminQuery({ page: 1, limit: 1, search: "", startDate, endDate });

    const typedProductsResponse = productsResponse as ProductsResponse | undefined;
    const nonPromotedProductsTotal = parsePositiveInt(typedProductsResponse?.meta?.total) ?? 0;
    const promotedProductsCount = typedProductsResponse?.data?.promotions?.length ?? 0;
    const totalListings = nonPromotedProductsTotal + promotedProductsCount;
    const loadingProducts = isProductsLoading || isProductsFetching;

    const {
        data: bookingStatsResponse,
        isLoading: isBookingStatsLoading,
        isFetching: isBookingStatsFetching,
    } = useGetServiceRequestStatsQuery({ startDate, endDate });

    const totalBookings = (bookingStatsResponse as BookingStatsResponse | undefined)?.data?.total;
    const loadingBookings = isBookingStatsLoading || isBookingStatsFetching;

    const {
        data: broadcastsResponse,
        isLoading: isBroadcastsLoading,
        isFetching: isBroadcastsFetching,
    } = useGetAllBroadcastsForAdminQuery({ page: 1, limit: 1, search: "", status: "", startDate, endDate });

    const totalBroadcasts = (broadcastsResponse as BroadcastsResponse | undefined)?.meta?.total;
    const loadingBroadcasts = isBroadcastsLoading || isBroadcastsFetching;

    const {
        data: feedVideosResponse,
        isLoading: isFeedVideosLoading,
        isFetching: isFeedVideosFetching,
    } = useGetFeedVideosQuery({ page: 1, limit: 1, search: "", startDate, endDate });

    const totalFeedVideos = (feedVideosResponse as FeedVideosResponse | undefined)?.meta?.total;
    const loadingFeedVideos = isFeedVideosLoading || isFeedVideosFetching;

    const {
        data: categoriesResponse,
        isLoading: isCategoriesLoading,
        isFetching: isCategoriesFetching,
    } = useGetAllCategoriesForAdminQuery({ startDate, endDate });

    const totalCategories = (categoriesResponse as CategoriesResponse | undefined)?.data?.length;
    const loadingCategories = isCategoriesLoading || isCategoriesFetching;

    const stats: StatCard[] = [
        {
            label: "Total Users",
            value: loadingUsers ? "..." : String(totalUsers ?? 0),
            icon: Users,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            href: "/admin/users",
        },
        {
            label: "Total Shops",
            value: loadingShops ? "..." : String(totalShops ?? 0),
            icon: Store,
            bg: "bg-green-4",
            color: "text-green-1",
            href: "/admin/shops",
        },
        {
            label: "Total Categories",
            value: loadingCategories ? "..." : String(totalCategories ?? 0),
            icon: Tags,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            href: "/admin/categories",
        },
        {
            label: "Total Listings",
            value: loadingProducts ? "..." : String(totalListings),
            icon: ClipboardList,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
            href: "/admin/listings",
        },
        {
            label: "Total Services",
            value: loadingServices ? "..." : String(totalServices ?? 0),
            icon: Wrench,
            bg: "bg-green-4",
            color: "text-green-1",
            href: "/admin/services",
        },
        {
            label: "Total Service Bookings",
            value: loadingBookings ? "..." : String(totalBookings ?? 0),
            icon: CalendarCheck,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            href: "/admin/bookings",
        },
        {
            label: "Total Echo Broadcasts",
            value: loadingBroadcasts ? "..." : String(totalBroadcasts ?? 0),
            icon: Radio,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
            href: "/admin/broadcasts",
        },
        {
            label: "Total Feed Videos",
            value: loadingFeedVideos ? "..." : String(totalFeedVideos ?? 0),
            icon: Video,
            bg: "bg-[#FDE9DF]",
            color: "text-orange",
            href: "/admin/feed",
        },
        {
            label: "Pending Shop Approvals",
            value: "12",
            comingSoon: true,
            icon: Clock,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
            href: "/admin/shops",
        },
        {
            label: "Pending Listing Approvals",
            value: "27",
            comingSoon: true,
            icon: Clock,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
            href: "/admin/listings",
        },
        {
            label: "Pending Service Approvals",
            value: "9",
            comingSoon: true,
            icon: Clock,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
            href: "/admin/services",
        },
        {
            label: "Pending Reports",
            value: "3",
            comingSoon: true,
            icon: Flag,
            bg: "bg-[#FDD5D5]",
            color: "text-[#E92440]",
            href: "/admin/reports",
        },
        {
            label: "Total Emails Sent",
            value: "1,368",
            comingSoon: true,
            icon: Mail,
            bg: "bg-green-4",
            color: "text-green-1",
            href: "/admin/email-logs",
        },
    ];

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-6 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <div className="relative flex items-center justify-between gap-4 rounded-[16px] bg-green-1 p-6 sm:p-8">
                        <Image
                            src={buttonDoodleImage}
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute inset-0 h-full w-full rounded-[inherit] object-cover"
                        />
                        <div className="relative z-10">
                            <h1 className="text-[20px] font-semibold text-white sm:text-[26px]">
                                Welcome to Fazl Admin
                            </h1>
                            <p className="mt-1 text-[13px] text-white/80 sm:text-[14px]">
                                Manage your marketplace activity efficiently
                            </p>
                        </div>
                        <div className="relative z-10">
                            <AdminProfileMenu />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white pb-10">
                <div className="container mx-auto px-5 pt-6 lg:px-10">
                    <div className="mb-4 flex justify-end">
                        <DateRangeFilter
                            value={dateFilter}
                            onChange={setDateFilter}
                            startDate={customStartDate}
                            endDate={customEndDate}
                            onStartDateChange={setCustomStartDate}
                            onEndDateChange={setCustomEndDate}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="flex flex-col justify-between rounded-[12px] border border-gray-9 p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <IconBadge icon={stat.icon} bg={stat.bg} color={stat.color} />
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-normal text-gray-11">
                                            {stat.label}
                                        </p>
                                        <p className="flex items-center gap-2 text-[20px] font-semibold text-[#001907]">
                                            {stat.value}
                                            {stat.comingSoon && (
                                                <span className="rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[10px] font-medium text-gray-6">
                                                    soon
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {stat.href && (
                                    <Link
                                        href={stat.href}
                                        className="mt-3 inline-flex items-center gap-1 self-end text-[12px] font-medium text-green-1 hover:underline"
                                    >
                                        View Details
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminDashboard;
