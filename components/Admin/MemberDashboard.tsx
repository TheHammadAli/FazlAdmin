"use client";

import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ListTodo, CheckCircle2, RotateCcw, ChevronRight } from "lucide-react";
import { useGetMyTaskStatsQuery } from "@/store/services/adminService";
import AdminProfileMenu from "@/components/Admin/AdminProfileMenu";
import buttonDoodleImage from "@/assets/images/button-doodle-image.svg";

type StatsResponse = {
    data?: {
        assigned?: number;
        completed?: number;
        revision?: number;
        submitted?: number;
    };
};

type MemberStatCard = {
    label: string;
    value: number;
    icon: LucideIcon;
    bg: string;
    color: string;
    href: string;
};

function MemberDashboard() {
    const { data, isLoading } = useGetMyTaskStatsQuery(undefined);
    const stats = (data as StatsResponse | undefined)?.data;

    const cards: MemberStatCard[] = [
        {
            label: "Tasks Assigned",
            value: stats?.assigned ?? 0,
            icon: ListTodo,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
            href: "/admin/my-tasks",
        },
        {
            label: "Completed",
            value: stats?.completed ?? 0,
            icon: CheckCircle2,
            bg: "bg-green-4",
            color: "text-green-1",
            href: "/admin/my-tasks?status=completed",
        },
        {
            label: "In Revision",
            value: stats?.revision ?? 0,
            icon: RotateCcw,
            bg: "bg-[#FDD5D5]",
            color: "text-[#E92440]",
            href: "/admin/submit-task?status=revision",
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
                                Welcome to Fazl
                            </h1>
                            <p className="mt-1 text-[13px] text-white/80 sm:text-[14px]">
                                Track and submit your assigned tasks
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.label}
                                    href={card.href}
                                    className="group flex flex-col justify-between rounded-[12px] border border-gray-9 p-4 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.2)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${card.bg}`}>
                                            <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={2} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-normal text-gray-11">
                                                {card.label}
                                            </p>
                                            <p className="text-[20px] font-semibold text-[#001907]">
                                                {isLoading ? "-" : card.value}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="mt-3 inline-flex items-center gap-1 self-end text-[12px] font-medium text-green-1 group-hover:underline">
                                        View Details
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MemberDashboard;
