"use client";

import { Menu } from "lucide-react";

function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    return (
        <div className="border-b border-gray-9 bg-white md:hidden">
            <header className="flex items-center px-5 py-4">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-gray-9 text-gray-8"
                    aria-label="Toggle menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </header>
        </div>
    );
}

export default AdminHeader;
