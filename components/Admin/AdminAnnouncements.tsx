"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Ui/Pagination";
import {
    useGetAllAnnouncementsForAdminQuery,
    useCreateAnnouncementMutation,
} from "@/store/services/adminService";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import { parsePositiveInt } from "@/utils/parsePositiveInt";

const PAGE_LIMIT = 10;

type Announcement = {
    id: string;
    code: string;
    title: string;
    message: string;
    createdAt: string;
};

type ApiAnnouncement = {
    _id?: string;
    announcementCode?: string;
    title?: string;
    message?: string;
    createdAt?: string;
};

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
    return {
        id: announcement._id ?? "",
        code: announcement.announcementCode ?? "-",
        title: announcement.title ?? "-",
        message: announcement.message ?? "-",
        createdAt: formatDateTime(announcement.createdAt),
    };
}

function AdminAnnouncements() {
    const { canEdit } = useCurrentAdminPermissions();
    const [page, setPage] = useState(1);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    const {
        data: announcementsResponse,
        isLoading,
        isFetching,
    } = useGetAllAnnouncementsForAdminQuery({ page, limit: PAGE_LIMIT });

    const [createAnnouncement, { isLoading: isSending }] = useCreateAnnouncementMutation();

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

    async function handleSend(event: React.FormEvent) {
        event.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error("Title and message are both required");
            return;
        }
        try {
            const response = await createAnnouncement({
                title: title.trim(),
                message: message.trim(),
            }).unwrap();
            toast.success((response as { message?: string })?.message ?? "Announcement sent successfully");
            setTitle("");
            setMessage("");
            setPage(1);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <Megaphone className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Announcements
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Send a message that will (eventually) reach every user via in-app and push
                        notification. For now, sent announcements are stored and listed below.
                    </p>
                </div>
            </div>

            <div className="bg-white">
                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <form
                        onSubmit={handleSend}
                        className="max-w-[560px] rounded-[12px] border border-gray-9 p-5"
                    >
                        <label className="text-[14px] font-normal text-gray-11">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. New feature: Echo Broadcasts"
                            disabled={!canSend}
                            className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <label className="mt-4 block text-[14px] font-normal text-gray-11">Message</label>
                        <textarea
                            required
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write the announcement message..."
                            disabled={!canSend}
                            className="mt-2 w-full resize-none rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            disabled={!canSend || isSending}
                            className="mt-4 inline-flex h-[40px] min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSending ? (
                                <BeatLoader color="white" size={8} />
                            ) : (
                                <>
                                    <Send className="h-4 w-4" strokeWidth={2} />
                                    Send Announcement
                                </>
                            )}
                        </button>
                        {!canSend && (
                            <p className="mt-2 text-[12px] text-gray-11">
                                You don&apos;t have permission to send announcements.
                            </p>
                        )}
                    </form>
                </div>

                <div className="container px-5 lg:px-10 mx-auto mt-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-[680px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Code
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
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 4 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && announcements.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
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
