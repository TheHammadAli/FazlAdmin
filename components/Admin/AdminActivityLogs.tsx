"use client";

import { useEffect, useState } from "react";
import { CalendarDays, LogIn, LogOut, Store, Trash2, UserCheck, UserX, Radio, ClipboardList, ClipboardCheck, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Pagination from "@/components/Ui/Pagination";
import {
    useGetAllActivityLogsQuery,
    useGetAllAdminAccountsQuery,
    useGetUserDetailQuery,
} from "@/store/services/adminService";
import { useAppSelector } from "@/store/store";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import searchIcon from "@/assets/icons/searchIcon.svg";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type ActivityLogAction =
    | "admin_login"
    | "admin_logout"
    | "user_suspended"
    | "user_enabled"
    | "shop_suspended"
    | "shop_enabled"
    | "listing_suspended"
    | "listing_enabled"
    | "listing_deleted"
    | "broadcast_deleted";

const ACTION_META: Record<ActivityLogAction, { label: string; icon: LucideIcon; bg: string; color: string }> = {
    admin_login: { label: "Admin Login", icon: LogIn, bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    admin_logout: { label: "Admin Logout", icon: LogOut, bg: "bg-[#F1F1F1]", color: "text-[#6B7280]" },
    user_suspended: { label: "User Suspended", icon: UserX, bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
    user_enabled: { label: "User Enabled", icon: UserCheck, bg: "bg-green-4", color: "text-green-1" },
    shop_suspended: { label: "Shop Suspended", icon: Store, bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
    shop_enabled: { label: "Shop Enabled", icon: Store, bg: "bg-green-4", color: "text-green-1" },
    listing_suspended: { label: "Listing Suspended", icon: ClipboardList, bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
    listing_enabled: { label: "Listing Enabled", icon: ClipboardCheck, bg: "bg-green-4", color: "text-green-1" },
    listing_deleted: { label: "Listing Deleted", icon: Trash2, bg: "bg-[#F1E9FE]", color: "text-[#7C4FE0]" },
    broadcast_deleted: { label: "Broadcast Deleted", icon: Radio, bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
};

const ACTION_FILTERS: { label: string; value: ActivityLogAction | "" }[] = [
    { label: "All", value: "" },
    ...(Object.keys(ACTION_META) as ActivityLogAction[]).map((value) => ({
        label: ACTION_META[value].label,
        value,
    })),
];

/** "" = All, "role:super_admin" = the Super Admin, "actor:<id>" = one specific Admin. */
type ActorFilterValue = "" | "role:super_admin" | `actor:${string}`;

type ApiAdminAccount = {
    _id?: string;
    name?: string;
    email?: string;
    roles?: string[];
};

type AdminAccountsResponse = {
    data?: ApiAdminAccount[];
};

type ActivityLogEntry = {
    id: string;
    logCode: number;
    action: ActivityLogAction;
    details?: string;
    ipAddress?: string;
    createdAt: string;
    actorName: string;
};

type ApiActivityLog = {
    _id?: string;
    logCode?: number;
    action?: string;
    details?: string;
    ipAddress?: string;
    createdAt?: string;
    actorInfo?: { name?: string; email?: string };
};

type ActivityLogsResponse = {
    data?: ApiActivityLog[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function isKnownAction(action?: string): action is ActivityLogAction {
    return Boolean(action && action in ACTION_META);
}

function mapApiLog(log: ApiActivityLog): ActivityLogEntry | null {
    if (!isKnownAction(log.action)) return null;

    return {
        id: log._id ?? `${log.logCode}`,
        logCode: log.logCode ?? 0,
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt ?? "",
        actorName: log.actorInfo?.name ?? log.actorInfo?.email ?? "An admin",
    };
}

function truncate(text: string, max = 60) {
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

function getLogTitle(log: ActivityLogEntry): string {
    const detail = log.details ? truncate(log.details) : undefined;

    switch (log.action) {
        case "admin_login":
            return `${log.actorName} logged into the system`;
        case "admin_logout":
            return `${log.actorName} logged out of the system`;
        case "user_suspended":
            return detail ? `${log.actorName} suspended user ${detail}` : `${log.actorName} suspended a user`;
        case "user_enabled":
            return detail ? `${log.actorName} enabled user ${detail}` : `${log.actorName} enabled a user`;
        case "shop_suspended":
            return detail ? `${log.actorName} suspended shop ${detail}` : `${log.actorName} suspended a shop`;
        case "shop_enabled":
            return detail ? `${log.actorName} enabled shop ${detail}` : `${log.actorName} enabled a shop`;
        case "listing_suspended":
            return detail ? `${log.actorName} suspended listing ${detail}` : `${log.actorName} suspended a listing`;
        case "listing_enabled":
            return detail ? `${log.actorName} enabled listing ${detail}` : `${log.actorName} enabled a listing`;
        case "listing_deleted":
            return detail ? `${log.actorName} deleted listing ${detail}` : `${log.actorName} deleted a listing`;
        case "broadcast_deleted":
            return detail
                ? `${log.actorName} deleted a broadcast request: "${detail}"`
                : `${log.actorName} deleted a broadcast request`;
        default:
            return `${log.actorName} performed an action`;
    }
}

function formatDateTime(value: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatRelativeTime(value: string) {
    if (!value) return "-";
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function AdminActivityLogs() {
    const currentUserId = useAppSelector((state) => state.authReducer.userId);
    const { data: currentUserData, isLoading: isCurrentUserLoading } = useGetUserDetailQuery(
        currentUserId,
        { skip: !currentUserId },
    );
    const currentUserRoles =
        (currentUserData as { data?: { roles?: string[] } } | undefined)?.data?.roles ?? [];
    const isSuperAdmin = currentUserRoles.includes("super_admin");

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState<ActivityLogAction | "">("");
    const [actorFilter, setActorFilter] = useState<ActorFilterValue>("");

    const { data: adminAccountsResponse } = useGetAllAdminAccountsQuery(
        { page: 1, limit: 200, search: "" },
        { skip: !isSuperAdmin },
    );

    const adminOptions = (
        (adminAccountsResponse as AdminAccountsResponse | undefined)?.data ?? []
    ).filter((account) => account.roles?.includes("admin") && account._id);

    const ACTOR_FILTERS: { label: string; value: ActorFilterValue }[] = [
        { label: "All", value: "" },
        { label: "Super Admin", value: "role:super_admin" },
        ...adminOptions.map((account) => ({
            label: account.name ?? account.email ?? "Admin",
            value: `actor:${account._id}` as ActorFilterValue,
        })),
    ];

    const roleFilter = actorFilter === "role:super_admin" ? "super_admin" : "";
    const actorIdFilter = actorFilter.startsWith("actor:") ? actorFilter.slice(6) : "";

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: logsResponse,
        isLoading,
        isFetching,
    } = useGetAllActivityLogsQuery(
        { page, limit: PAGE_LIMIT, search, action: actionFilter, role: roleFilter, actorId: actorIdFilter },
        { skip: !isSuperAdmin },
    );

    const logs = ((logsResponse as ActivityLogsResponse | undefined)?.data ?? [])
        .map(mapApiLog)
        .filter((log): log is ActivityLogEntry => log !== null);

    const totalLogs =
        parsePositiveInt((logsResponse as ActivityLogsResponse | undefined)?.meta?.total) ??
        logs.length;

    const pageCount =
        parsePositiveInt((logsResponse as ActivityLogsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalLogs / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    if (!isCurrentUserLoading && !isSuperAdmin) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    Only Super Admins can access Activity Logs.
                </p>
            </section>
        );
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Activity Logs
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Audit trail of admin actions across the platform
                    </p>
                </div>

                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative w-full max-w-[320px]">
                            <Image
                                src={searchIcon}
                                alt=""
                                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                            />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search by admin name or email..."
                                className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                            />
                        </div>

                        <select
                            value={actorFilter}
                            onChange={(event) => {
                                setActorFilter(event.target.value as ActorFilterValue);
                                setPage(1);
                            }}
                            className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {ACTOR_FILTERS.map((filter) => (
                                <option key={filter.value || "all"} value={filter.value}>
                                    {filter.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {ACTION_FILTERS.map((filter) => (
                            <button
                                key={filter.label}
                                type="button"
                                onClick={() => {
                                    setActionFilter(filter.value);
                                    setPage(1);
                                }}
                                className={`h-9 cursor-pointer rounded-[8px] border px-3 text-[13px] font-medium transition-colors ${actionFilter === filter.value
                                    ? "border-green-1 bg-green-1 text-white"
                                    : "border-gray-9 bg-white text-gray-8 hover:border-green-1 hover:text-green-1"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    {loading &&
                        Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={`skeleton-${index}`}
                                className="mb-3 h-[86px] animate-pulse rounded-[10px] border border-gray-9 bg-gray-10"
                            />
                        ))}

                    {!loading && logs.length === 0 && (
                        <div className="py-16 text-center text-[14px] text-gray-11">
                            No activity logs found
                        </div>
                    )}

                    {!loading &&
                        logs.map((log) => {
                            const meta = ACTION_META[log.action];
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={log.id}
                                    className="mb-3 flex items-start gap-3 rounded-[10px] border border-gray-9 bg-white p-4"
                                >
                                    <span
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.bg}`}
                                    >
                                        <Icon className={`h-5 w-5 ${meta.color}`} strokeWidth={2} />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-medium text-[#001907]">
                                            {getLogTitle(log)}
                                        </p>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            <span className="text-[12px] font-normal text-gray-11">
                                                #{log.logCode}
                                            </span>
                                            <span
                                                className={`inline-flex rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.color}`}
                                            >
                                                {meta.label}
                                            </span>
                                        </div>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-normal text-gray-11">
                                            <span>IP: {log.ipAddress || "—"}</span>
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {formatDateTime(log.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="shrink-0 whitespace-nowrap text-[12px] font-normal text-gray-11">
                                        {formatRelativeTime(log.createdAt)}
                                    </span>
                                </div>
                            );
                        })}
                </div>

                {!loading && (
                    <Pagination
                        className="container mx-auto px-5 lg:px-10"
                        pageCount={pageCount}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </section>
    );
}

export default AdminActivityLogs;
