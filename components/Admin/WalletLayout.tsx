"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
    Wallet,
    LayoutDashboard,
    Users,
    Store,
    Percent,
    ArrowLeftRight,
    Banknote,
    RotateCcw,
    History,
    Settings,
} from "lucide-react";

const WALLET_TABS: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Dashboard", href: "/admin/wallet", icon: LayoutDashboard },
    { label: "User Wallets", href: "/admin/wallet/users", icon: Users },
    { label: "Merchant Wallets", href: "/admin/wallet/merchants", icon: Store },
    { label: "Merchant Deals", href: "/admin/wallet/merchant-deals", icon: Percent },
    { label: "Transactions", href: "/admin/wallet/transactions", icon: ArrowLeftRight },
    { label: "Withdrawals", href: "/admin/wallet/withdrawals", icon: Banknote },
    { label: "Refunds", href: "/admin/wallet/refunds", icon: RotateCcw },
    { label: "Audit Log", href: "/admin/wallet/audit-log", icon: History },
    { label: "Settings", href: "/admin/wallet/settings", icon: Settings },
];

function isTabActive(pathname: string, href: string) {
    if (href === "/admin/wallet") return pathname === "/admin/wallet";
    return pathname.startsWith(href);
}

/** All 9 Wallet screens live under one sidebar entry ("Wallet") — this renders the shared
 *  "Wallet" header once, plus an underline tab row that switches between them below it, each
 *  still its own route for deep-linking/back-forward. Individual pages own only their own
 *  page-specific description/toolbar/content beneath this shell. */
function WalletLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col">
            <div className="bg-[#F6F8FA] pt-10 pb-0">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <Wallet className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Wallet
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage user &amp; merchant wallets, transactions, withdrawals, refunds, deals and settings
                    </p>
                </div>

                <nav className="container mx-auto mt-5 flex gap-6 overflow-x-auto border-b border-gray-9 px-5 lg:px-10">
                    {WALLET_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = isTabActive(pathname, tab.href);

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 py-3 text-[14px] font-medium transition-colors ${active
                                    ? "border-green-1 text-green-1"
                                    : "border-transparent text-gray-8 hover:text-green-1"
                                    }`}
                            >
                                <Icon className="h-4 w-4" strokeWidth={2} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="min-w-0 flex-1 bg-white">{children}</div>
        </div>
    );
}

export default WalletLayout;
