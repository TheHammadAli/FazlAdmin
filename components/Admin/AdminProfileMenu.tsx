"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { User, Activity, LogOut } from "lucide-react";
import { useGetOwnProfileQuery } from "@/store/services/profileService";
import { useClickOutside } from "@/custom-hooks/useClickOutside";
import LogoutConfirmModal from "@/components/Admin/LogoutConfirmModal";

type ApiUserDetail = {
    name?: string;
    email?: string;
    roles?: string[];
};

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
};

function toAdminRole(roles?: string[]): string {
    if (roles?.includes("super_admin")) return "super_admin";
    if (roles?.includes("moderator")) return "moderator";
    return "admin";
}

function AdminProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, () => setIsOpen(false));

    const { data } = useGetOwnProfileQuery(undefined);
    const user = (data as { data?: ApiUserDetail } | undefined)?.data;
    const role = toAdminRole(user?.roles);
    const roleLabel = ROLE_LABELS[role] ?? role;

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Open profile menu"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-green-1"
            >
                <User className="h-5 w-5" strokeWidth={2} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 z-20 w-[240px] rounded-[12px] border border-gray-9 bg-white p-2 shadow-xl">
                    <div className="flex items-center gap-3 rounded-[8px] p-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-4 text-[13px] font-semibold text-green-1">
                            {user?.name ? getInitials(user.name) : <User className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-[#001907]">
                                {user?.name ?? "Admin"}
                            </p>
                            <p className="truncate text-[12px] text-gray-11">{user?.email ?? "-"}</p>
                            <span className="mt-1 inline-flex rounded-[4px] bg-green-4 px-1.5 py-0.5 text-[10px] font-medium text-green-1">
                                {roleLabel}
                            </span>
                        </div>
                    </div>

                    <div className="my-1 border-t border-gray-9" />

                    <Link
                        href="/admin/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-gray-8 transition-colors hover:bg-gray-10 hover:text-green-1"
                    >
                        <User className="h-[18px] w-[18px]" strokeWidth={2} />
                        Profile
                    </Link>
                    <Link
                        href="/admin/activity-logs"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-gray-8 transition-colors hover:bg-gray-10 hover:text-green-1"
                    >
                        <Activity className="h-[18px] w-[18px]" strokeWidth={2} />
                        Activities
                    </Link>

                    <div className="my-1 border-t border-gray-9" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            setIsLogoutModalOpen(true);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-red-1 transition-colors hover:bg-[#FDD5D5]"
                    >
                        <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
                        Log Out
                    </button>
                </div>
            )}

            <LogoutConfirmModal
                open={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />
        </div>
    );
}

export default AdminProfileMenu;
