"use client";

import WalletLayout from "@/components/Admin/WalletLayout";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";

function AdminWalletLayout({ children }: { children: React.ReactNode }) {
    const { isSuperAdmin, has, isLoading } = useCurrentAdminPermissions();

    if (isLoading) {
        return null;
    }

    if (!isSuperAdmin && !has("wallet")) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    You don&apos;t have permission to view the Wallet module.
                </p>
            </section>
        );
    }

    return <WalletLayout>{children}</WalletLayout>;
}

export default AdminWalletLayout;
