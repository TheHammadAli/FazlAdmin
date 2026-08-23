"use client";

export type AdminAction = "view" | "edit" | "delete";
export type AdminPage =
    | "users"
    | "shops"
    | "listings"
    | "services"
    | "categories"
    | "bookings"
    | "broadcasts"
    | "announcements"
    | "feed"
    | "reports"
    | "email-logs"
    | "analytics"
    | "settings"
    | "members"
    | "wallet"
    | "reviews";

export type PermissionEntry = { page: AdminPage; actions: AdminAction[] };

const EXPANDED_PAGES: { value: AdminPage; label: string }[] = [
    { value: "users", label: "Users" },
    { value: "shops", label: "Shops" },
    { value: "listings", label: "Listings" },
    { value: "categories", label: "Categories" },
    { value: "bookings", label: "Service Bookings" },
    { value: "members", label: "Members" },
    { value: "wallet", label: "Wallet" },
    { value: "reviews", label: "Reviews" },
];

const SIMPLE_PAGES: { value: AdminPage; label: string }[] = [
    { value: "services", label: "Services" },
    { value: "broadcasts", label: "Echo Broadcasts" },
    { value: "announcements", label: "Announcements" },
    { value: "feed", label: "Feed" },
    { value: "reports", label: "Reports" },
    { value: "email-logs", label: "Email Logs" },
    { value: "analytics", label: "Analytics" },
    { value: "settings", label: "Settings" },
];

type PermissionsPickerProps = {
    value: PermissionEntry[];
    onChange: (next: PermissionEntry[]) => void;
};

function PermissionsPicker({ value, onChange }: PermissionsPickerProps) {
    function isPageChecked(page: AdminPage) {
        return value.some((p) => p.page === page);
    }

    function hasAction(page: AdminPage, action: AdminAction) {
        return value.find((p) => p.page === page)?.actions.includes(action) ?? false;
    }

    function togglePage(page: AdminPage) {
        if (isPageChecked(page)) {
            onChange(value.filter((p) => p.page !== page));
            return;
        }
        const isExpanded = EXPANDED_PAGES.some((o) => o.value === page);
        const defaultActions: AdminAction[] = isExpanded
            ? ["view"]
            : ["view", "edit", "delete"];
        onChange([...value, { page, actions: defaultActions }]);
    }

    function toggleAction(page: AdminPage, action: "edit" | "delete") {
        onChange(
            value.map((p) => {
                if (p.page !== page) return p;
                return {
                    ...p,
                    actions: p.actions.includes(action)
                        ? p.actions.filter((a) => a !== action)
                        : [...p.actions, action],
                };
            }),
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-[14px] font-normal text-gray-11">
                    Section Access
                </label>
                <div className="mt-2 space-y-2">
                    {EXPANDED_PAGES.map((opt) => (
                        <div
                            key={opt.value}
                            className="rounded-[8px] border border-gray-9 px-3 py-2"
                        >
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#001907]">
                                <input
                                    type="checkbox"
                                    checked={isPageChecked(opt.value)}
                                    onChange={() => togglePage(opt.value)}
                                    className="h-4 w-4 accent-green-1"
                                />
                                {opt.label}
                            </label>
                            {isPageChecked(opt.value) && (
                                <div className="mt-2 ml-6 flex flex-wrap gap-4 text-[12px] text-gray-11">
                                    <label className="flex items-center gap-1.5 opacity-60">
                                        <input
                                            type="checkbox"
                                            checked
                                            disabled
                                            className="h-3.5 w-3.5 accent-green-1"
                                        />
                                        View
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={hasAction(opt.value, "edit")}
                                            onChange={() => toggleAction(opt.value, "edit")}
                                            className="h-3.5 w-3.5 accent-green-1"
                                        />
                                        Edit
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={hasAction(opt.value, "delete")}
                                            onChange={() => toggleAction(opt.value, "delete")}
                                            className="h-3.5 w-3.5 accent-green-1"
                                        />
                                        Delete
                                    </label>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-[14px] font-normal text-gray-11">
                    Other Sections
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {SIMPLE_PAGES.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 px-3 py-2 text-[13px] text-[#001907]"
                        >
                            <input
                                type="checkbox"
                                checked={isPageChecked(opt.value)}
                                onChange={() => togglePage(opt.value)}
                                className="h-4 w-4 accent-green-1"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PermissionsPicker;
