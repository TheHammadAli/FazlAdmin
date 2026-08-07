"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import {
    Play,
    Trash2,
    Eye,
    Users,
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    type LucideIcon,
} from "lucide-react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import {
    useGetFeedVideosQuery,
    useSuspendFeedVideoMutation,
    useEnableFeedVideoMutation,
    useDeleteProductMutation,
} from "@/store/services/adminService";
import { parsePositiveInt } from "@/utils/parsePositiveInt";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import searchIcon from "@/assets/icons/searchIcon.svg";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 50;

type FeedStatus = "active" | "suspended";

type FeedVideo = {
    id: string;
    videoCode: string;
    title: string;
    video: string;
    thumbnail?: string;
    ownerLabel: string;
    category: string;
    status: FeedStatus;
    createdAt: string;
};

type ApiFeedVideo = {
    _id?: string;
    id?: string;
    videoCode?: string;
    title?: string;
    video?: string;
    images?: string[];
    category?: { name?: { en?: string; ur?: string } } | string;
    shopId?: { title?: string };
    ownerId?: { name?: string };
    isDisabled?: boolean;
    createdAt?: string;
};

type FeedVideosResponse = {
    data?: ApiFeedVideo[];
    meta?: {
        total?: number | string;
        totalPages?: number | string;
    };
};

const PLACEHOLDER_METRICS: { label: string; icon: LucideIcon; value: string }[] = [
    { label: "Total Views", icon: Eye, value: "3,542" },
    { label: "Unique Views", icon: Users, value: "2,187" },
    { label: "Likes", icon: Heart, value: "412" },
    { label: "Comments", icon: MessageCircle, value: "68" },
    { label: "Shares", icon: Share2, value: "35" },
    { label: "Saves", icon: Bookmark, value: "91" },
];

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function mapApiFeedVideo(item: ApiFeedVideo): FeedVideo {
    return {
        id: item._id ?? item.id ?? "",
        videoCode: item.videoCode ?? "-",
        title: item.title ?? "-",
        video: item.video ?? "",
        thumbnail: item.images?.[0],
        ownerLabel: item.shopId?.title ?? item.ownerId?.name ?? "-",
        category: getFeedCategoryLabel(item.category ?? "", "en") || "-",
        status: item.isDisabled ? "suspended" : "active",
        createdAt: formatDate(item.createdAt),
    };
}

type PendingStatusChange = {
    video: FeedVideo;
    action: "suspend" | "enable";
};

function AdminFeed() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [previewVideo, setPreviewVideo] = useState<FeedVideo | null>(null);
    const previewModalRef = useRef<HTMLDivElement>(null);

    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const statusModalRef = useRef<HTMLDivElement>(null);

    const [deletingVideo, setDeletingVideo] = useState<FeedVideo | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const {
        data: feedResponse,
        isLoading,
        isFetching,
    } = useGetFeedVideosQuery({ page, limit: PAGE_LIMIT, search });

    const [suspendFeedVideo, { isLoading: isSuspending }] = useSuspendFeedVideoMutation();
    const [enableFeedVideo, { isLoading: isEnabling }] = useEnableFeedVideoMutation();
    const isChangingStatus = isSuspending || isEnabling;
    const [deleteProduct] = useDeleteProductMutation();

    const videos = ((feedResponse as FeedVideosResponse | undefined)?.data ?? []).map(
        mapApiFeedVideo,
    );

    const totalVideos =
        parsePositiveInt((feedResponse as FeedVideosResponse | undefined)?.meta?.total) ??
        videos.length;

    const pageCount =
        parsePositiveInt((feedResponse as FeedVideosResponse | undefined)?.meta?.totalPages) ??
        Math.max(1, Math.ceil(totalVideos / PAGE_LIMIT));

    const loading = isLoading || isFetching;

    function closePreview() {
        setPreviewVideo(null);
    }

    function openStatusModal(video: FeedVideo) {
        setPendingStatusChange({
            video,
            action: video.status === "active" ? "suspend" : "enable",
        });
        setIsStatusModalOpen(true);
    }

    function closeStatusModal() {
        if (isChangingStatus) return;
        setIsStatusModalOpen(false);
        setPendingStatusChange(null);
    }

    async function handleConfirmStatusChange() {
        if (!pendingStatusChange) return;
        try {
            const response =
                pendingStatusChange.action === "suspend"
                    ? await suspendFeedVideo(pendingStatusChange.video.id).unwrap()
                    : await enableFeedVideo(pendingStatusChange.video.id).unwrap();
            toast.success((response as { message?: string })?.message ?? "Video status updated");
            setIsStatusModalOpen(false);
            // Keep the preview modal's own copy of status in sync if it's open for this video.
            setPreviewVideo((prev) =>
                prev && prev.id === pendingStatusChange.video.id
                    ? { ...prev, status: pendingStatusChange.action === "suspend" ? "suspended" : "active" }
                    : prev,
            );
            setPendingStatusChange(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    function closeDeleteModal() {
        if (isDeleting) return;
        setDeletingVideo(null);
    }

    async function handleConfirmDelete() {
        if (!deletingVideo) return;
        setIsDeleting(true);
        try {
            const response = await deleteProduct(deletingVideo.id).unwrap();
            toast.success(response.message ?? "Video deleted successfully");
            setDeletingVideo(null);
            setPreviewVideo((prev) => (prev && prev.id === deletingVideo.id ? null : prev));
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <section>
            {/* Wide video preview modal */}
            <Modal
                editModalRef={previewModalRef}
                open={Boolean(previewVideo)}
                setOpen={(value) => {
                    const nextOpen = typeof value === "function" ? value(Boolean(previewVideo)) : value;
                    if (!nextOpen) closePreview();
                }}
                centered
            >
                {previewVideo && (
                    <div className="hide-scrollbar w-[92vw] max-w-[820px] rounded-[12px] bg-white p-5 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="truncate text-[16px] font-semibold text-[#001907]">
                                    {previewVideo.title}
                                </h2>
                                <p className="mt-0.5 truncate text-[12px] text-gray-11">
                                    {previewVideo.ownerLabel} · {previewVideo.category} · {previewVideo.videoCode}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closePreview}
                                aria-label="Close"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                            >
                                <XMarkIcon className="h-5 w-5 text-[#001907]" />
                            </button>
                        </div>

                        <video
                            key={previewVideo.id}
                            src={previewVideo.video}
                            controls
                            autoPlay
                            className="mt-4 max-h-[65vh] w-full rounded-[10px] bg-black"
                        />

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-gray-9 py-3">
                            {PLACEHOLDER_METRICS.map((metric) => {
                                const Icon = metric.icon;
                                return (
                                    <span
                                        key={metric.label}
                                        className="inline-flex items-center gap-1.5 text-[12px] text-gray-8"
                                    >
                                        <Icon className="h-3.5 w-3.5 text-gray-6" strokeWidth={2} />
                                        {metric.label}: <span className="font-medium text-gray-6">{metric.value}</span>
                                    </span>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ToggleSwitch
                                    checked={previewVideo.status === "active"}
                                    disabled={isChangingStatus}
                                    ariaLabel={
                                        previewVideo.status === "active"
                                            ? `Suspend ${previewVideo.title}`
                                            : `Enable ${previewVideo.title}`
                                    }
                                    onChange={() => openStatusModal(previewVideo)}
                                />
                                <span className="text-[13px] text-gray-8">
                                    {previewVideo.status === "active" ? "Active" : "Suspended"}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeletingVideo(previewVideo)}
                                className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#E92440] hover:underline"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete video
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                editModalRef={statusModalRef}
                open={isStatusModalOpen}
                setOpen={(value) => {
                    const nextOpen = typeof value === "function" ? value(isStatusModalOpen) : value;
                    if (!nextOpen) closeStatusModal();
                }}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingStatusChange?.action === "enable" ? "Enable video" : "Suspend video"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to {pendingStatusChange?.action === "enable" ? "enable" : "suspend"}{" "}
                        <span className="font-medium text-[#001907]">
                            {pendingStatusChange?.video.title}
                        </span>
                        ?
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeStatusModal}
                            disabled={isChangingStatus}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isChangingStatus}
                            onClick={handleConfirmStatusChange}
                            className={`h-[40px] flex-1 cursor-pointer rounded-[8px] border text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${pendingStatusChange?.action === "enable"
                                ? "border-green-1 bg-green-1"
                                : "border-[#E92440] bg-[#E92440]"
                                }`}
                        >
                            {isChangingStatus ? <BeatLoader color="white" size={8} /> : "Confirm"}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                editModalRef={deleteModalRef}
                open={Boolean(deletingVideo)}
                setOpen={(value) => {
                    const nextOpen = typeof value === "function" ? value(Boolean(deletingVideo)) : value;
                    if (!nextOpen) closeDeleteModal();
                }}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                    <h2 className="text-[16px] font-semibold text-black-1">Delete video</h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-[#001907]">{deletingVideo?.title}</span>?
                        This cannot be undone.
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            disabled={isDeleting}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isDeleting ? <BeatLoader color="white" size={8} /> : "Delete"}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Feed Videos
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage feed videos posted on the marketplace
                    </p>
                </div>

                <div className="container mx-auto mt-4 px-5 lg:px-10">
                    <div className="relative max-w-[320px]">
                        <Image
                            src={searchIcon}
                            alt=""
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search by video title..."
                            className="h-10 w-full rounded-[8px] border border-gray-9 bg-white pl-9 pr-3 text-[14px] text-[#001907] outline-none placeholder:text-gray-11 focus:border-green-1"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto mt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-[880px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Video ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Video
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Category
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Metrics
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Created
                                    </th>
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && videos.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No feed videos found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    videos.map((video) => (
                                        <tr key={video.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {video.videoCode}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewVideo(video)}
                                                    className="group flex max-w-[280px] cursor-pointer items-center gap-3 text-left"
                                                >
                                                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[6px] bg-black">
                                                        {video.thumbnail ? (
                                                            <Image
                                                                src={video.thumbnail}
                                                                unoptimized
                                                                alt=""
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={noImageIcon}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        )}
                                                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/45">
                                                            <Play className="h-3.5 w-3.5 fill-white text-white" />
                                                        </span>
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-[14px] font-normal text-[#001907] group-hover:underline">
                                                            {video.title}
                                                        </span>
                                                        <span className="block truncate text-[12px] text-gray-11">
                                                            {video.ownerLabel}
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="py-3.5 pr-4 text-[14px] font-normal capitalize text-gray-11">
                                                {video.category}
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    {PLACEHOLDER_METRICS.map((metric) => {
                                                        const Icon = metric.icon;
                                                        return (
                                                            <span
                                                                key={metric.label}
                                                                title={metric.label}
                                                                className="inline-flex items-center gap-0.5 text-[11px] text-gray-6"
                                                            >
                                                                <Icon className="h-3 w-3" strokeWidth={2} />
                                                                {metric.value}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <ToggleSwitch
                                                        checked={video.status === "active"}
                                                        disabled={isChangingStatus}
                                                        ariaLabel={
                                                            video.status === "active"
                                                                ? `Suspend ${video.title}`
                                                                : `Enable ${video.title}`
                                                        }
                                                        onChange={() => openStatusModal(video)}
                                                    />
                                                    <span className="whitespace-nowrap text-[12px] text-gray-11">
                                                        {video.status === "active" ? "Active" : "Suspended"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {video.createdAt}
                                            </td>
                                            <td className="py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingVideo(video)}
                                                    aria-label={`Delete ${video.title}`}
                                                    className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-gray-8 hover:text-[#E92440]"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
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

export default AdminFeed;
