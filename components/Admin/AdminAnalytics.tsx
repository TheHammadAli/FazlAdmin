"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Users, Store, ClipboardList, Wrench, CalendarCheck, Tags } from "lucide-react";
import {
    useGetAllUsersFromAdminQuery,
    useGetAllShopsFromAdminQuery,
    useGetAllServicesForAdminQuery,
    useGetAllProductsForAdminQuery,
    useGetServiceRequestStatsQuery,
    useGetAllCategoriesForAdminQuery,
} from "@/store/services/adminService";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";

type UsersResponse = { meta?: { total?: number | string } };
type ShopsResponse = { meta?: { total?: number | string } };
type ServicesResponse = { meta?: { total?: number | string } };
type ProductsResponse = { data?: { promotions?: unknown[] }; meta?: { total?: number | string } };
type BookingStatsResponse = { data?: { total?: number } };
type CategoriesResponse = { data?: unknown[] };

type StatTile = {
    label: string;
    value: string;
    icon: LucideIcon;
    bg: string;
    color: string;
};

function StatTileView({ stat }: { stat: StatTile }) {
    return (
        <div className="flex items-center gap-3 rounded-[12px] border border-gray-9 p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
            </span>
            <div className="min-w-0">
                <p className="truncate text-[13px] font-normal text-gray-11">{stat.label}</p>
                <p className="text-[20px] font-semibold text-[#001907]">{stat.value}</p>
            </div>
        </div>
    );
}

function BarChartCard({ data }: { data: { label: string; value: number; color: string }[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const trackHeight = 160;

    return (
        <div className="flex items-end justify-between gap-3" style={{ height: trackHeight + 34 }}>
            {data.map((d) => (
                <div key={d.label} className="flex h-full flex-1 flex-col items-center">
                    <div className="flex flex-1 items-end">
                        <span className="mb-1 text-[12px] font-semibold text-[#001907]">{d.value}</span>
                    </div>
                    <div
                        className="w-full rounded-t-[3px]"
                        style={{
                            height: `${Math.max((d.value / max) * trackHeight, 6)}px`,
                            backgroundColor: d.color,
                        }}
                    />
                    <span className="mt-2 truncate text-[11px] text-gray-11">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

function DonutChartCard({ data }: { data: { label: string; value: number; color: string }[] }) {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let offsetAccum = 0;

    return (
        <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <svg viewBox="0 0 100 100" className="h-[140px] w-[140px] shrink-0 -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#F6F6F6" strokeWidth="14" />
                {data.map((d) => {
                    const fraction = d.value / total;
                    const dash = fraction * circumference;
                    const segment = (
                        <circle
                            key={d.label}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={d.color}
                            strokeWidth="14"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offsetAccum}
                        />
                    );
                    offsetAccum += dash;
                    return segment;
                })}
            </svg>
            <div className="space-y-2.5">
                {data.map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-[13px]">
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: d.color }}
                        />
                        <span className="font-medium text-[#001907]">{d.label}</span>
                        <span className="text-gray-11">{Math.round((d.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TrendChartCard({
    data,
    labels,
    color,
}: {
    data: number[];
    labels: string[];
    color: string;
}) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 300;
    const height = 120;
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;
    const points = data
        .map((value, index) => `${index * stepX},${height - ((value - min) / range) * height}`)
        .join(" ");
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    const gradientId = `analytics-trend-${color.replace("#", "")}`;

    return (
        <div>
            <svg viewBox={`0 0 ${width} ${height}`} className="h-[160px] w-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill={`url(#${gradientId})`} />
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="mt-2 flex justify-between text-[11px] text-gray-11">
                {labels.map((label, index) => (
                    <span key={`${label}-${index}`}>{label}</span>
                ))}
            </div>
        </div>
    );
}

function AdminAnalytics() {
    const { isSuperAdmin, has } = useCurrentAdminPermissions();
    const canView = isSuperAdmin || has("analytics");

    const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const { startDate, endDate } = getDateRangeForFilter(dateFilter, customStartDate, customEndDate);

    const { data: usersResponse } = useGetAllUsersFromAdminQuery({ page: 1, limit: 1, startDate, endDate });
    const totalUsers = parsePositiveInt((usersResponse as UsersResponse | undefined)?.meta?.total) ?? 0;

    const { data: shopsResponse } = useGetAllShopsFromAdminQuery({
        page: 1,
        limit: 1,
        search: "",
        startDate,
        endDate,
    });
    const totalShops = parsePositiveInt((shopsResponse as ShopsResponse | undefined)?.meta?.total) ?? 0;

    const { data: servicesResponse } = useGetAllServicesForAdminQuery({
        page: 1,
        limit: 1,
        search: "",
        startDate,
        endDate,
    });
    const totalServices = parsePositiveInt((servicesResponse as ServicesResponse | undefined)?.meta?.total) ?? 0;

    const { data: productsResponse } = useGetAllProductsForAdminQuery({
        page: 1,
        limit: 1,
        search: "",
        startDate,
        endDate,
    });
    const typedProductsResponse = productsResponse as ProductsResponse | undefined;
    const nonPromotedProductsTotal = parsePositiveInt(typedProductsResponse?.meta?.total) ?? 0;
    const promotedProductsCount = typedProductsResponse?.data?.promotions?.length ?? 0;
    const totalListings = nonPromotedProductsTotal + promotedProductsCount;

    const { data: bookingStatsResponse } = useGetServiceRequestStatsQuery({ startDate, endDate });
    const totalBookings = (bookingStatsResponse as BookingStatsResponse | undefined)?.data?.total ?? 0;

    const { data: categoriesResponse } = useGetAllCategoriesForAdminQuery({ startDate, endDate });
    const totalCategories = (categoriesResponse as CategoriesResponse | undefined)?.data?.length ?? 0;

    if (!canView) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    You don&apos;t have permission to view Analytics.
                </p>
            </section>
        );
    }

    const statTiles: StatTile[] = [
        { label: "Total Users", value: String(totalUsers), icon: Users, bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
        { label: "Total Shops", value: String(totalShops), icon: Store, bg: "bg-green-4", color: "text-green-1" },
        {
            label: "Total Listings",
            value: String(totalListings),
            icon: ClipboardList,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
        },
        {
            label: "Total Services",
            value: String(totalServices),
            icon: Wrench,
            bg: "bg-[#FDE9DF]",
            color: "text-orange",
        },
        {
            label: "Bookings",
            value: String(totalBookings),
            icon: CalendarCheck,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
        },
        { label: "Categories", value: String(totalCategories), icon: Tags, bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    ];

    const growthBarData = [
        { label: "Users", value: totalUsers, color: "#2F6FE4" },
        { label: "Shops", value: totalShops, color: "#007781" },
        { label: "Listings", value: totalListings, color: "#7C4FE0" },
        { label: "Services", value: totalServices, color: "#EE6134" },
        { label: "Bookings", value: totalBookings, color: "#946200" },
        { label: "Categories", value: totalCategories, color: "#3C9197" },
    ];

    const compositionData = [
        { label: "Listings", value: Math.max(totalListings, 0), color: "#7C4FE0" },
        { label: "Services", value: Math.max(totalServices, 0), color: "#EE6134" },
        { label: "Shops", value: Math.max(totalShops, 0), color: "#007781" },
    ];

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-7">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <BarChart3 className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Analytics
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Visual breakdown of your marketplace performance
                    </p>
                </div>
            </div>

            <div className="bg-white pb-14">
                <div className="container mx-auto px-5 pt-8 lg:px-10">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-[16px] font-semibold text-[#001907]">Overview</h2>
                        <DateRangeFilter
                            value={dateFilter}
                            onChange={setDateFilter}
                            startDate={customStartDate}
                            endDate={customEndDate}
                            onStartDateChange={setCustomStartDate}
                            onEndDateChange={setCustomEndDate}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {statTiles.map((stat) => (
                            <StatTileView key={stat.label} stat={stat} />
                        ))}
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="rounded-[12px] border border-gray-9 p-5">
                            <p className="text-[14px] font-semibold text-[#001907]">Marketplace Growth</p>
                            <p className="mt-0.5 text-[12px] text-gray-11">
                                Totals across your marketplace right now
                            </p>
                            <div className="mt-5">
                                <BarChartCard data={growthBarData} />
                            </div>
                        </div>

                        <div className="rounded-[12px] border border-gray-9 p-5">
                            <p className="text-[14px] font-semibold text-[#001907]">Content Mix</p>
                            <p className="mt-0.5 text-[12px] text-gray-11">
                                Share of listings, services and shops
                            </p>
                            <div className="mt-5">
                                <DonutChartCard data={compositionData} />
                            </div>
                        </div>

                        <div className="rounded-[12px] border border-gray-9 p-5 lg:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-[14px] font-semibold text-[#001907]">
                                        New User Signups
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-gray-11">Last 7 days</p>
                                </div>
                                <span className="rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[10px] font-medium text-gray-6">
                                    soon
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-11">
                                Preview only — daily trend tracking isn&apos;t wired to the backend yet
                            </p>
                            <div className="mt-5">
                                <TrendChartCard
                                    data={[12, 18, 15, 22, 28, 24, 31]}
                                    labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                                    color="#2F6FE4"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminAnalytics;
