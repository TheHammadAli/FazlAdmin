"use client";

import { useState } from "react";
import {
    Wallet,
    User,
    Store,
    PlusCircle,
    CreditCard,
    ArrowLeftRight,
    Percent,
    TrendingUp,
    Banknote,
    Clock,
    HourglassIcon,
    RotateCcw,
} from "lucide-react";
import { useGetWalletDashboardStatsQuery } from "@/store/services/adminService";
import DateRangeFilter, { type DateFilterValue } from "@/components/Ui/DateRangeFilter";
import { getDateRangeForFilter } from "@/utils/getDateRangeForFilter";
import { formatMoneyMinor } from "@/utils/formatMoney";
import StatTileView, { type StatTile } from "@/components/Ui/StatTileView";
import type { ApiEnvelope, WalletDashboardStats } from "@/store/services/walletTypes";

function AdminWalletDashboard() {
    const [dateFilter, setDateFilter] = useState<DateFilterValue>("this_month");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const { startDate, endDate } = getDateRangeForFilter(dateFilter, customStartDate, customEndDate);

    const { data, isLoading, isFetching } = useGetWalletDashboardStatsQuery({ startDate, endDate });
    const stats = (data as ApiEnvelope<WalletDashboardStats> | undefined)?.data;
    const loading = isLoading || isFetching;

    const v = (n: number | undefined) => (loading ? "..." : formatMoneyMinor(n ?? 0));
    const c = (n: number | undefined) => (loading ? "..." : String(n ?? 0));

    const balanceTiles: StatTile[] = [
        {
            label: "Total Wallet Balance",
            value: v(stats?.totalWalletBalanceMinor),
            icon: Wallet,
            bg: "bg-green-4",
            color: "text-green-1",
        },
        {
            label: "User Wallet Balance",
            value: v(stats?.userWalletBalanceMinor),
            icon: User,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            href: "/admin/wallet/users",
        },
        {
            label: "Merchant Wallet Balance",
            value: v(stats?.merchantWalletBalanceMinor),
            icon: Store,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
            href: "/admin/wallet/merchants",
        },
    ];

    const periodTiles: StatTile[] = [
        {
            label: "Total Money Added",
            value: v(stats?.totalMoneyAddedMinor),
            icon: PlusCircle,
            bg: "bg-green-4",
            color: "text-green-1",
        },
        {
            label: "Total Payments",
            value: v(stats?.totalPaymentsMinor),
            icon: CreditCard,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
        },
        {
            label: "Total Transactions",
            value: c(stats?.totalTransactions),
            icon: ArrowLeftRight,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
            href: "/admin/wallet/transactions",
        },
        {
            label: "Total Discounts",
            value: v(stats?.totalDiscountsMinor),
            icon: Percent,
            bg: "bg-[#FDE9DF]",
            color: "text-orange",
        },
        {
            label: "Total Fazl Earnings",
            value: v(stats?.totalFazlEarningsMinor),
            icon: TrendingUp,
            bg: "bg-green-4",
            color: "text-green-1",
        },
        {
            label: "Total Withdrawals",
            value: v(stats?.totalWithdrawalsMinor),
            icon: Banknote,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
            href: "/admin/wallet/withdrawals",
        },
        {
            label: "Pending Withdrawals",
            value: c(stats?.pendingWithdrawals),
            icon: Clock,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
            href: "/admin/wallet/withdrawals",
        },
        {
            label: "Pending Transactions",
            value: c(stats?.pendingTransactions),
            icon: HourglassIcon,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            href: "/admin/wallet/transactions",
        },
        {
            label: "Refunds",
            value: v(stats?.refundsMinor),
            icon: RotateCcw,
            bg: "bg-[#FDD5D5]",
            color: "text-[#E92440]",
            href: "/admin/wallet/refunds",
        },
    ];

    return (
        <section>
            <div className="bg-white pb-14">
                <div className="container mx-auto px-5 pt-8 lg:px-10">
                    <div className="mb-4">
                        <h2 className="text-[16px] font-semibold text-[#001907]">Current Balances</h2>
                        <p className="text-[12px] text-gray-11">Point-in-time — not affected by the date filter</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {balanceTiles.map((stat) => (
                            <StatTileView key={stat.label} stat={stat} />
                        ))}
                    </div>

                    <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-[16px] font-semibold text-[#001907]">Activity This Period</h2>
                            <p className="text-[12px] text-gray-11">Filtered by the selected date range</p>
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {periodTiles.map((stat) => (
                            <StatTileView key={stat.label} stat={stat} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminWalletDashboard;
