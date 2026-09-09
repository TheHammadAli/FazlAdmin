"use client";

import AdminDashboard from "@/components/Admin/AdminDashboard";
import MemberDashboard from "@/components/Admin/MemberDashboard";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";

/** Swaps the whole dashboard component by role so AdminDashboard's
 *  admin-only queries never mount for a member (moderator) account. */
function DashboardSwitch() {
    const { isLoading, isSuperAdmin, roles } = useCurrentAdminPermissions();

    if (isLoading) {
        return (
            <section className="container mx-auto px-5 pt-10 lg:px-10">
                <div className="h-[120px] animate-pulse rounded-[16px] bg-gray-10" />
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[110px] animate-pulse rounded-[12px] bg-gray-10" />
                    ))}
                </div>
            </section>
        );
    }

    const isMember =
        !isSuperAdmin &&
        !roles.includes("admin") &&
        !roles.includes("subadmin") &&
        roles.includes("moderator");

    return isMember ? <MemberDashboard /> : <AdminDashboard />;
}

export default DashboardSwitch;
