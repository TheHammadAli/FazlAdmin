"use client";

import { useState, type ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

function AdminLayout({ children }: { children: ReactNode }) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F6F8FA]">
            <aside className="hidden h-screen border-r border-gray-9 md:block md:w-64 md:shrink-0">
                <AdminSidebar />
            </aside>

            {isMobileNavOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsMobileNavOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
                        <AdminSidebar onNavigate={() => setIsMobileNavOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex h-screen flex-1 flex-col overflow-y-auto">
                <AdminHeader onMenuClick={() => setIsMobileNavOpen(true)} />
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}

export default AdminLayout;
