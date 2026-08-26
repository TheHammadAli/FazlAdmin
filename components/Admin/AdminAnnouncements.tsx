"use client";

import { useState } from "react";
import { Megaphone, Pencil, Plus } from "lucide-react";
import Pagination from "@/components/Ui/Pagination";
import DoodleButton from "@/components/Ui/DoodleButton";
import AnnouncementFormModal, {
    type AnnouncementFormMode,
} from "@/components/Admin/AnnouncementFormModal";
import { useGetAllAnnouncementsForAdminQuery } from "@/store/services/adminService";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import { parsePositiveInt } from "@/utils/parsePositiveInt";

const PAGE_LIMIT = 10;

type AnnouncementStatus = "draft" | "scheduled" | "sent";
type Priority = "low" | "medium" | "high";

type Announcement = {
    id: string;
    code: string;
    title: string;
    message: string;
    createdAt: string;
    status: AnnouncementStatus;
    image?: string;
    video?: string;
    targetAudience?: string[];
    categoryId?: string;
    location?: string;
    ctaLabel?: string;
    ctaDestination?: string;
    scheduledAt?: string;
    expiresAt?: string;
    priority: Priority;
};

type ApiAnnouncement = {
    _id?: string;
    announcementCode?: string;
    title?: string;
    message?: string;
    createdAt?: string;
    status?: string;
    image?: string;
    video?: string;
    targetAudience?: string[];
    category?: { _id?: string } | string;
    location?: string;
    ctaLabel?: string;
    ctaDestination?: string;
    scheduledAt?: string;
    expiresAt?: string;
    priority?: string;
};

const STATUS_META: Record<AnnouncementStatus, { label: string; bg: string; color: string }> = {
    draft: { label: "Draft", bg: "bg-gray-10", color: "text-gray-8" },
    scheduled: { label: "Scheduled", bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
    sent: { label: "Sent", bg: "bg-green-4", color: "text-green-1" },
};

function toAnnouncementStatus(value?: string): AnnouncementStatus {
    return value === "draft" || value === "scheduled" ? value : "sent";
}

function toPriority(value?: string): Priority {
    return value === "low" || value === "high" ? value : "medium";
}

type AnnouncementsResponse = {
    data?: ApiAnnouncement[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function mapApiAnnouncement(announcement: ApiAnnouncement): Announcement {
    const categoryId =
        typeof announcement.category === "string" ? announcement.category : announcement.category?._id;

    return {
        id: announcement._id ?? "",
        code: announcement.announcementCode ?? "-",
        title: announcement.title ?? "-",
        message: announcement.message ?? "-",
        createdAt: formatDateTime(announcement.createdAt),
        status: toAnnouncementStatus(announcement.status),
        image: announcement.image,
        video: announcement.video,
        targetAudience: announcement.targetAudience,
        categoryId,
        location: announcement.location,
        ctaLabel: announcement.ctaLabel,
        ctaDestination: announcement.ctaDestination,
        scheduledAt: announcement.scheduledAt,
        expiresAt: announcement.expiresAt,
        priority: toPriority(announcement.priority),
    };
}

function AdminAnnouncements() {
    const { canEdit } = useCurrentAdminPermissions();
    const [page, setPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<AnnouncementFormMode>("add");

    const {
        data: announcementsResponse,
        isLoading,
        isFetching,
    } = useGetAllAnnouncementsForAdminQuery({ page, limit: PAGE_LIMIT });

    const announcements = (
        (announcementsResponse as AnnouncementsResponse | undefined)?.data ?? []
    ).map(mapApiAnnouncement);

    const totalAnnouncements =
        parsePositiveInt((announcementsResponse as AnnouncementsResponse | undefined)?.meta?.total) ??
        announcements.length;

    const pageCount =
        parsePositiveInt((announcementsResponse as AnnouncementsResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalAnnouncements / PAGE_LIMIT));

    const loading = isLoading || isFetching;
    const canSend = canEdit("announcements");

    function openAddForm() {
        setFormMode("add");
        setIsFormOpen(true);
    }

    function openEditForm(announcement: Announcement) {
        setFormMode({
            type: "edit",
            announcement: {
                id: announcement.id,
                title: announcement.title,
                message: announcement.message,
                image: announcement.image,
                video: announcement.video,
                targetAudience: announcement.targetAudience,
                category: announcement.categoryId,
                location: announcement.location,
                ctaLabel: announcement.ctaLabel,
                ctaDestination: announcement.ctaDestination,
                scheduledAt: announcement.scheduledAt,
                expiresAt: announcement.expiresAt,
                priority: announcement.priority,
            },
        });
        setIsFormOpen(true);
    }

    return (
        <section>
            <AnnouncementFormModal
                open={isFormOpen}
                mode={formMode}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => setPage(1)}
            />

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto flex flex-wrap items-start justify-between gap-4 px-5 lg:px-10">
                    <div>
                        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                            <Megaphone className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Announcements
                        </h1>
                        <p className="mt-1 text-[12px] font-normal text-gray-11">
                            Send Now delivers immediately to every targeted user via in-app and push
                            notification. Scheduled announcements are saved but not sent automatically yet —
                            use Send Now when ready.
                        </p>
                    </div>
                    <DoodleButton
                        type="button"
                        onClick={openAddForm}
                        disabled={!canSend}
                        className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-green-1 px-4 py-2 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Announcement
                    </DoodleButton>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-[760px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Id
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Title
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Message
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Sent Date
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && announcements.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No announcements sent yet
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    announcements.map((announcement) => (
                                        <tr key={announcement.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {announcement.code}
                                            </td>
                                            <td className="py-3.5 pr-4 text-[14px] font-medium text-[#001907]">
                                                {announcement.title}
                                            </td>
                                            <td className="max-w-[320px] truncate py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {announcement.message}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {announcement.createdAt}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${STATUS_META[announcement.status].bg} ${STATUS_META[announcement.status].color}`}
                                                >
                                                    {STATUS_META[announcement.status].label}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                {announcement.status === "draft" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditForm(announcement)}
                                                        disabled={!canSend}
                                                        className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-green-1 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
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

export default AdminAnnouncements;
