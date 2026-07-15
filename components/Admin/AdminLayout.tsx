"use client";

import type { ReactNode } from "react";
import AdminHeader from "./AdminHeader";

function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen ">
            <AdminHeader />
            <main>{children}</main>
        </div>
    );
}

export default AdminLayout;
