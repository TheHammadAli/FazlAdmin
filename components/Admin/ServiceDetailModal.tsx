"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Wrench, Eye, Users, Phone, MessageCircle, Pencil, Star, ChevronDown, ChevronUp } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import {
    useGetServiceDetailQuery,
    useGetItemReviewsQuery,
    useGetItemReviewsAverageQuery,
} from "@/store/services/adminService";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";
import ServiceEditModal, { type EditableService } from "@/components/Admin/ServiceEditModal";

type PaymentType = "hourly" | "fixed" | "call_for_price";

type ApiServiceDetail = {
    _id?: string;
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    paymentType?: PaymentType;
    images?: string[];
    createdAt?: string;
    category?: { _id?: string; name?: { en?: string; ur?: string } } | string;
    ownerId?: { name?: string; email?: string; phone?: string };
    requiresAppointment?: boolean;
    parameters?: { name: string; variants: string[] }[];
    totalViews?: number;
    uniqueVisitorsCount?: number;
    contactClicks?: number;
    whatsappClicks?: number;
};

function toEditableService(service: ApiServiceDetail): EditableService {
    const categoryValue = service.category;
    const categoryId = typeof categoryValue === "string" ? categoryValue : categoryValue?._id ?? "";

    return {
        id: service._id ?? service.id ?? "",
        title: service.title ?? "",
        description: service.description ?? "",
        price: service.price,
        paymentType: service.paymentType ?? "fixed",
        requiresAppointment: service.requiresAppointment,
        category: categoryId,
        images: service.images,
        parameters: service.parameters,
    };
}

function formatPrice(price: number | undefined, paymentType: PaymentType | undefined) {
    if (paymentType === "call_for_price" || price == null) {
        return "Call for price";
    }
    return `Rs. ${price.toLocaleString()}${paymentType === "hourly" ? " /hr" : ""}`;
}

type StatTile = {
    label: string;
    value: string;
    icon: typeof Eye;
    bg: string;
    color: string;
    comingSoon?: boolean;
    expandKey?: "reviews";
};

function buildAnalyticsTiles(service: ApiServiceDetail | undefined, loading: boolean): StatTile[] {
    const v = (n: number | undefined) => (loading ? "..." : (n ?? 0).toLocaleString());
    return [
        {
            label: "Total Views",
            value: v(service?.totalViews),
            icon: Eye,
            bg: "bg-[#F1E9FE]",
            color: "text-[#7C4FE0]",
        },
        {
            label: "Unique Visitors",
            value: v(service?.uniqueVisitorsCount),
            icon: Users,
            bg: "bg-[#FDE9DF]",
            color: "text-orange",
        },
        {
            label: "Contact Clicks",
            value: v(service?.contactClicks),
            icon: Phone,
            bg: "bg-[#FDEAB8]",
            color: "text-[#946200]",
        },
        {
            label: "WhatsApp Clicks",
            value: v(service?.whatsappClicks),
            icon: MessageCircle,
            bg: "bg-green-4",
            color: "text-green-1",
        },
    ];
}

const REVIEWS_PAGE_LIMIT = 5;

type ApiReview = {
    _id?: string;
    rating?: number;
    comment?: string;
    createdAt?: string;
    userId?: { name?: string; image?: string };
};

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
    const rounded = Math.round(rating);
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    style={{ width: size, height: size }}
                    className={i <= rounded ? "fill-[#FFB03A] text-[#FFB03A]" : "fill-none text-gray-9"}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

function ServiceReviewsPanel({
    serviceId,
    page,
    onPageChange,
}: {
    serviceId: string;
    page: number;
    onPageChange: (page: number) => void;
}) {
    const { data: listData, isLoading, isFetching } = useGetItemReviewsQuery({
        itemId: serviceId,
        itemType: "service",
        page,
        limit: REVIEWS_PAGE_LIMIT,
    });

    const reviews =
        (listData as { data?: { reviews?: ApiReview[] } } | undefined)?.data?.reviews ?? [];
    const totalPages = Math.max(
        1,
        Number((listData as { data?: { totalPages?: number } } | undefined)?.data?.totalPages) || 1,
    );
    const loading = isLoading || isFetching;

    if (loading) {
        return (
            <div className="space-y-2">
                <div className="h-14 w-full animate-pulse rounded-[8px] bg-gray-200" />
                <div className="h-14 w-full animate-pulse rounded-[8px] bg-gray-200" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return <p className="py-2 text-center text-[13px] text-gray-11">No reviews yet</p>;
    }

    return (
        <div>
            <div className="space-y-2">
                {reviews.map((review, index) => (
                    <div key={review._id ?? index} className="rounded-[8px] border border-gray-9 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-medium text-[#001907]">
                                {review.userId?.name ?? "Anonymous"}
                            </p>
                            <RatingStars rating={review.rating ?? 0} size={12} />
                        </div>
                        {review.comment && (
                            <p className="mt-1 text-[13px] text-gray-8">{review.comment}</p>
                        )}
                        {review.createdAt && (
                            <p className="mt-1 text-[11px] text-gray-11">
                                {new Date(review.createdAt).toISOString().slice(0, 10)}
                            </p>
                        )}
                    </div>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between text-[12px] text-gray-11">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="cursor-pointer font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="cursor-pointer font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

type ServiceDetailModalProps = {
    serviceId: string | null;
    onClose: () => void;
};

function ServiceDetailModal({ serviceId, onClose }: ServiceDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [expandedTile, setExpandedTile] = useState<"reviews" | null>(null);
    const [reviewsPage, setReviewsPage] = useState(1);

    useEffect(() => {
        setIsEditOpen(false);
        setExpandedTile(null);
        setReviewsPage(1);
    }, [serviceId]);

    function toggleExpanded(key: "reviews") {
        setExpandedTile((prev) => (prev === key ? null : key));
        setReviewsPage(1);
    }

    const { data, isLoading, isFetching } = useGetServiceDetailQuery(serviceId ?? "", {
        skip: !serviceId,
    });
    const service = (data as { data?: ApiServiceDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const serviceIdValue = service?._id ?? service?.id ?? "";
    const { data: avgData } = useGetItemReviewsAverageQuery(
        { itemId: serviceIdValue, itemType: "service" },
        { skip: !serviceIdValue },
    );
    const avgRating =
        (avgData as { data?: { avgRating?: number; count?: number } } | undefined)?.data?.avgRating ?? 0;
    const reviewCount =
        (avgData as { data?: { avgRating?: number; count?: number } } | undefined)?.data?.count ?? 0;

    const stats: StatTile[] = [
        ...buildAnalyticsTiles(service, loading),
        {
            label: "Reviews",
            value: reviewCount > 0 ? `${avgRating.toFixed(1)} (${reviewCount})` : "No reviews",
            icon: Star,
            bg: "bg-[#FDD5D5]",
            color: "text-[#E92440]",
            expandKey: "reviews",
        },
    ];

    const isOpen = Boolean(serviceId);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    const createdAt = service?.createdAt
        ? new Date(service.createdAt).toISOString().slice(0, 10)
        : "-";

    return (
        <>
        <Modal
            editModalRef={modalRef}
            open={isOpen}
            setOpen={handleSetOpen}
            centered
            disableOutsideClick={isEditOpen}
        >
            <div className="flex max-h-[90vh] w-[92vw] max-w-[500px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Wrench className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Service Details
                    </h2>
                    <div className="flex shrink-0 items-center gap-2">
                        {service && (
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(true)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-[6px] border border-gray-9 px-2.5 py-1.5 text-[13px] font-medium text-gray-8 hover:border-green-1 hover:text-green-1"
                            >
                                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                                Edit
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="inline-flex h-8 w-8 items-center justify-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-[#001907]" />
                        </button>
                    </div>
                </div>

                <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-5">
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-16 w-full animate-pulse rounded-[10px] bg-gray-200" />
                        <div className="h-24 w-full animate-pulse rounded-[10px] bg-gray-200" />
                    </div>
                ) : !service ? (
                    <p className="text-[14px] text-gray-11">Service not found.</p>
                ) : (
                    <>
                        <div className="flex items-center gap-4 rounded-[10px] bg-gray-10 p-4">
                            {service.images?.[0] ? (
                                <Image
                                    src={service.images[0]}
                                    unoptimized
                                    alt=""
                                    height={56}
                                    width={56}
                                    className="h-14 w-14 shrink-0 rounded-[8px] object-cover"
                                />
                            ) : (
                                <Image
                                    src={noImageIcon}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-[8px] object-cover"
                                />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[16px] font-semibold text-[#001907]">
                                    {service.title ?? "-"}
                                </p>
                                <p className="truncate text-[13px] text-gray-11">
                                    {formatPrice(service.price, service.paymentType)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Category
                                </p>
                                <p className="mt-1 text-[14px] capitalize text-[#001907]">
                                    {getFeedCategoryLabel(service.category ?? "", "en") || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Created
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">{createdAt}</p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Provider
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {service.ownerId?.name ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Contact
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {service.ownerId?.phone ?? service.ownerId?.email ?? "-"}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Description
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {service.description ?? "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-3 text-[13px] font-medium text-gray-8">
                                Service Analytics
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {stats.map((stat) => {
                                    const Icon = stat.icon;

                                    if (stat.expandKey) {
                                        const isExpanded = expandedTile === stat.expandKey;

                                        return (
                                            <div
                                                key={stat.label}
                                                className="sm:col-span-2 rounded-[10px] border border-gray-9"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(stat.expandKey as "reviews")}
                                                    className="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${stat.bg}`}
                                                    >
                                                        <Icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[12px] text-gray-11">
                                                            {stat.label}
                                                        </p>
                                                        <p className="text-[15px] font-semibold text-[#001907]">
                                                            {stat.value}
                                                        </p>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 shrink-0 text-gray-11" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-11" />
                                                    )}
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-gray-9 p-3">
                                                        {stat.expandKey === "reviews" && (
                                                            <ServiceReviewsPanel
                                                                serviceId={serviceIdValue}
                                                                page={reviewsPage}
                                                                onPageChange={setReviewsPage}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={stat.label}
                                            className="flex items-center gap-3 rounded-[10px] border border-gray-9 p-3"
                                        >
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${stat.bg}`}
                                            >
                                                <Icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] text-gray-11">
                                                    {stat.label}
                                                </p>
                                                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-[#001907]">
                                                    {stat.value}
                                                    {stat.comingSoon && (
                                                        <span className="rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[9px] font-medium text-gray-6">
                                                            soon
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
                </div>

                <div className="flex shrink-0 justify-end border-t border-gray-9 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-gray-9 px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>

        <ServiceEditModal
            open={isEditOpen}
            service={service ? toEditableService(service) : null}
            onClose={() => setIsEditOpen(false)}
        />
        </>
    );
}

export default ServiceDetailModal;
