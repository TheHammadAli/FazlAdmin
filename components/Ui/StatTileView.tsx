"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export type StatTile = {
    label: string;
    value: string;
    icon: LucideIcon;
    bg: string;
    color: string;
    href?: string;
    comingSoon?: boolean;
};

function StatTileView({ stat }: { stat: StatTile }) {
    const content = (
        <>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-normal text-gray-11">{stat.label}</p>
                <p className="flex items-center gap-1.5 text-[20px] font-semibold text-[#001907]">
                    {stat.value}
                    {stat.comingSoon && (
                        <span className="rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[9px] font-medium text-gray-6">
                            soon
                        </span>
                    )}
                </p>
            </div>
            {stat.href && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-9 transition-colors group-hover:text-green-1" />
            )}
        </>
    );

    const className =
        "group flex items-center gap-2.5 rounded-[12px] border border-gray-9 p-4 transition-all" +
        (stat.href ? " hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.2)]" : "");

    if (stat.href) {
        return (
            <Link href={stat.href} className={className}>
                {content}
            </Link>
        );
    }

    return <div className={className}>{content}</div>;
}

export default StatTileView;
