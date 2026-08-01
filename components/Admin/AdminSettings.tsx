"use client";

import Link from "next/link";
import { Tags, Layers, Building2, MapPin, Mail, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SettingsTile = {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
    bg: string;
    color: string;
    comingSoon?: boolean;
};

const SETTINGS_TILES: SettingsTile[] = [
    {
        label: "Categories",
        description: "Manage product and service categories",
        href: "/admin/categories",
        icon: Tags,
        bg: "bg-green-4",
        color: "text-green-1",
    },
    {
        label: "Subcategories",
        description: "Manage subcategories nested under each category",
        href: "/admin/settings/subcategories",
        icon: Layers,
        bg: "bg-[#F1E9FE]",
        color: "text-[#7C4FE0]",
        comingSoon: true,
    },
    {
        label: "Cities",
        description: "Manage the list of cities the marketplace operates in",
        href: "/admin/settings/cities",
        icon: Building2,
        bg: "bg-[#E7F0FF]",
        color: "text-[#2F6FE4]",
        comingSoon: true,
    },
    {
        label: "Areas",
        description: "Manage areas within each city",
        href: "/admin/settings/areas",
        icon: MapPin,
        bg: "bg-[#FDE9DF]",
        color: "text-orange",
        comingSoon: true,
    },
    {
        label: "Email Templates",
        description: "Manage templates used for outgoing emails",
        href: "/admin/settings/email-templates",
        icon: Mail,
        bg: "bg-[#FDEAB8]",
        color: "text-[#946200]",
        comingSoon: true,
    },
];

function AdminSettings() {
    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Settings
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Configure general admin panel settings
                    </p>
                </div>
            </div>

            <div className="bg-white pb-10">
                <div className="container mx-auto px-5 pt-6 lg:px-10">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {SETTINGS_TILES.map((tile) => {
                            const Icon = tile.icon;

                            return (
                                <Link
                                    key={tile.href}
                                    href={tile.href}
                                    className="flex items-start gap-3 rounded-[12px] border border-gray-9 p-4 transition-colors hover:border-green-1"
                                >
                                    <span
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${tile.bg}`}
                                    >
                                        <Icon className={`h-5 w-5 ${tile.color}`} strokeWidth={2} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-medium text-[#001907]">
                                                {tile.label}
                                            </p>
                                            {tile.comingSoon && (
                                                <span className="rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[10px] font-medium text-gray-6">
                                                    soon
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[12px] text-gray-11">
                                            {tile.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-11" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminSettings;
