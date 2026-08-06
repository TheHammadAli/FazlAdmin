"use client";

import { useRef } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Wrench, Eye, Users, Phone, MessageCircle } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetServiceDetailQuery } from "@/store/services/adminService";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

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
    category?: { name?: { en?: string; ur?: string } } | string;
    ownerId?: { name?: string; email?: string; phone?: string };
};

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
};

const ANALYTICS_TILES: StatTile[] = [
    {
        label: "Total Views",
        value: "—",
        comingSoon: true,
        icon: Eye,
        bg: "bg-[#F1E9FE]",
        color: "text-[#7C4FE0]",
    },
    {
        label: "Unique Visitors",
        value: "—",
        comingSoon: true,
        icon: Users,
        bg: "bg-[#FDE9DF]",
        color: "text-orange",
    },
    {
        label: "Contact Clicks",
        value: "—",
        comingSoon: true,
        icon: Phone,
        bg: "bg-[#FDEAB8]",
        color: "text-[#946200]",
    },
    {
        label: "WhatsApp Clicks",
        value: "—",
        comingSoon: true,
        icon: MessageCircle,
        bg: "bg-green-4",
        color: "text-green-1",
    },
];

type ServiceDetailModalProps = {
    serviceId: string | null;
    onClose: () => void;
};

function ServiceDetailModal({ serviceId, onClose }: ServiceDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetServiceDetailQuery(serviceId ?? "", {
        skip: !serviceId,
    });
    const service = (data as { data?: ApiServiceDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

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
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[560px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Wrench className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Service Details
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 items-center justify-center"
                    >
                        <XMarkIcon className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                {loading ? (
                    <div className="mt-6 space-y-4">
                        <div className="h-16 w-full animate-pulse rounded-[10px] bg-gray-200" />
                        <div className="h-24 w-full animate-pulse rounded-[10px] bg-gray-200" />
                    </div>
                ) : !service ? (
                    <p className="mt-6 text-[14px] text-gray-11">Service not found.</p>
                ) : (
                    <>
                        <div className="mt-5 flex items-center gap-4 rounded-[10px] bg-gray-10 p-4">
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
                                {ANALYTICS_TILES.map((stat) => {
                                    const Icon = stat.icon;
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

                <div className="mt-6 flex justify-end">
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
    );
}

export default ServiceDetailModal;
