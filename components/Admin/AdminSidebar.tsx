"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutConfirmModal from "@/components/Admin/LogoutConfirmModal";
import { useAppSelector } from "@/store/store";
import { useGetUserDetailQuery } from "@/store/services/adminService";
import {
    LayoutDashboard,
    Users,
    Tags,
    User,
    LogOut,
    Store,
    ClipboardList,
    Wrench,
    CalendarCheck,
    Radio,
    Video,
    Flag,
    Settings,
    ShieldCheck,
    UserCog,
    ListTodo,
    Mail,
    History,
} from "lucide-react";
import FazlLogo from "@/assets/icons/fazal-logo.svg";

const ADMIN_NAV_SECTIONS = [
    {
        section: "Overview",
        items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
    },
    {
        section: "Marketplace",
        items: [
            { label: "Users", href: "/admin/users", icon: Users, permission: "users" },
            { label: "Categories", href: "/admin/categories", icon: Tags, permission: "categories" },
            { label: "Shops", href: "/admin/shops", icon: Store, permission: "shops" },
            { label: "Listings", href: "/admin/listings", icon: ClipboardList, permission: "listings" },
            { label: "Services", href: "/admin/services", icon: Wrench, permission: "services" },
        ],
    },
    {
        section: "Activity",
        items: [
            { label: "Service Bookings", href: "/admin/bookings", icon: CalendarCheck, permission: "bookings" },
            { label: "Echo Broadcasts", href: "/admin/broadcasts", icon: Radio, permission: "broadcasts" },
            { label: "Feed", href: "/admin/feed", icon: Video, permission: "feed" },
            { label: "Reports", href: "/admin/reports", icon: Flag, permission: "reports" },
        ],
    },
    {
        section: "Administration",
        items: [
            { label: "Admins", href: "/admin/admins", icon: ShieldCheck },
            { label: "Members", href: "/admin/members", icon: UserCog },
            { label: "Tasks", href: "/admin/tasks", icon: ListTodo },
            { label: "Email Logs", href: "/admin/email-logs", icon: Mail, permission: "email-logs" },
            { label: "Activity Logs", href: "/admin/activity-logs", icon: History },
        ],
    },
    {
        section: "System",
        items: [{ label: "Settings", href: "/admin/settings", icon: Settings, permission: "settings" }],
    },
];

function isNavActive(pathname: string, href: string) {
    if (href === "/admin") {
        return pathname === "/admin";
    }
    return pathname.includes(href);
}

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const userId = useAppSelector((state) => state.authReducer.userId);
    const { data } = useGetUserDetailQuery(userId, { skip: !userId });
    const currentUser = (data as { data?: { roles?: string[]; permissions?: string[] } } | undefined)?.data;
    const currentUserRoles = currentUser?.roles ?? [];
    const currentUserPermissions = currentUser?.permissions ?? [];
    const isSuperAdmin = currentUserRoles.includes("super_admin");

    const isAdminOrSuperAdmin = isSuperAdmin || currentUserRoles.includes("admin");

    const navSections = ADMIN_NAV_SECTIONS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
            if (item.href === "/admin/admins" || item.href === "/admin/activity-logs") return isSuperAdmin;
            if (item.href === "/admin/members" || item.href === "/admin/tasks") return isAdminOrSuperAdmin;
            if (item.permission) return isSuperAdmin || currentUserPermissions.includes(item.permission);
            return true;
        }),
    })).filter((group) => group.items.length > 0);

    return (
        <div className="flex h-full w-full flex-col bg-white">
            <div className="flex shrink-0 items-center gap-2 px-6 py-6">
                <Image src={FazlLogo} alt="Fazl logo" className="h-9 w-9" />
                <span className="text-[16px] font-semibold text-[#001907]">Fazl Admin</span>
            </div>

            <div className="mx-4 mt-4 flex shrink-0 items-center gap-2 rounded-[8px] border-l-[3px] border-green-1 bg-green-4 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-green-1">
                    <User className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-medium text-[#001907]">Admin</span>
            </div>

            <div className="hide-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto border-t border-gray-9 bg-white px-4 pt-5 pb-5">
                {navSections.map((group, groupIndex) => (
                    <div key={group.section} className={groupIndex > 0 ? "mt-5" : ""}>
                        <p className="px-3 text-[11px] font-medium uppercase tracking-wide text-gray-6">
                            {group.section}
                        </p>
                        <nav className="mt-2 space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = isNavActive(pathname, item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium transition-colors ${isActive
                                            ? "bg-green-4 text-green-1"
                                            : "text-gray-8 hover:bg-gray-10 hover:text-green-1"
                                            }`}
                                    >
                                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            <div className="shrink-0 border-t border-gray-9 px-4 py-4">
                <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-red-1 transition-colors hover:bg-[#FDD5D5]"
                >
                    <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
                    Logout
                </button>
            </div>

            <LogoutConfirmModal
                open={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
}

export default AdminSidebar;
