"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/store";
import { logout } from "@/store/reducers/authReducer";

const ADMIN_NAV = [
    { label: "Users", href: "/admin/users" },
    { label: "Categories", href: "/admin/categories" },
    // { label: "Promotion Settings", href: "/admin/promotion-settings" },
];
// test to deploy

function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        dispatch(logout());
        router.push("/en/signin");
    };

    return (
        <div className="bg-white border-b border-gray-9  ">
            <header className=" container mx-auto py-4 px-5 lg:px-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center rounded-[6px] bg-green-1 px-4 py-2">
                        <span className="text-[14px] font-medium text-white sm:text-[15px]">
                            Fazl- Admin
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="shrink-0 cursor-pointer rounded-[6px] border border-gray-9 px-4 h-9  text-[14px] font-medium text-[#4B514F] transition-colors hover:border-green-1 hover:text-green-1"
                        >
                            Logout
                        </button>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EE6134] text-[13px] font-semibold text-white">
                            NM
                        </div>
                    </div>
                </div>

                <nav className="mt-5 flex flex-wrap items-center gap-6 sm:gap-8">
                    {ADMIN_NAV.map((item) => {
                        const isActive = pathname.includes(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative pb-2 text-[14px] font-normal transition-colors sm:text-[15px] ${isActive
                                    ? "text-green-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-green-1"
                                    : "text-[#4B514F] hover:text-green-1"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </header>
        </div>

    );
}

export default AdminHeader;
