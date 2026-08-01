"use client";

import { useRef } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
    Store,
    Package,
    ShoppingCart,
    Eye,
    Users,
    Phone,
    MessageCircle,
    Heart,
} from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetShopDetailQuery } from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

type ApiShopDetail = {
    _id?: string;
    id?: string;
    title?: string;
    image?: string;
    banner?: string;
    address?: string;
    description?: string;
    isDisabled?: boolean;
    createdAt?: string;
    productsCount?: number;
    ordersCount?: number;
    ownerId?: {
        name?: string;
        email?: string;
    };
};

type StatTile = {
    label: string;
    value: string;
    icon: typeof Store;
    bg: string;
    color: string;
    comingSoon?: boolean;
};

type ShopDetailModalProps = {
    shopId: string | null;
    onClose: () => void;
};

function ShopDetailModal({ shopId, onClose }: ShopDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetShopDetailQuery(shopId ?? "", {
        skip: !shopId,
    });
    const shop = (data as { data?: ApiShopDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const isOpen = Boolean(shopId);
    const isActive = !shop?.isDisabled;

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    const createdAt = shop?.createdAt
        ? new Date(shop.createdAt).toISOString().slice(0, 10)
        : "-";

    const stats: StatTile[] = [
        {
            label: "Products",
            value: loading ? "..." : String(shop?.productsCount ?? 0),
            icon: Package,
            bg: "bg-green-4",
            color: "text-green-1",
        },
        {
            label: "Orders",
            value: loading ? "..." : String(shop?.ordersCount ?? 0),
            icon: ShoppingCart,
            bg: "bg-[#E7F0FF]",
            color: "text-[#2F6FE4]",
        },
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
        {
            label: "Followers",
            value: "—",
            comingSoon: true,
            icon: Heart,
            bg: "bg-[#FDD5D5]",
            color: "text-[#E92440]",
        },
    ];

    return (
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[640px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Store className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Shop Details
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
                ) : !shop ? (
                    <p className="mt-6 text-[14px] text-gray-11">Shop not found.</p>
                ) : (
                    <>
                        <div className="mt-5 flex items-center gap-4 rounded-[10px] bg-gray-10 p-4">
                            {shop.image ? (
                                <Image
                                    src={shop.image}
                                    unoptimized
                                    alt=""
                                    height={56}
                                    width={56}
                                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <Image
                                    src={noImageIcon}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                                />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[16px] font-semibold text-[#001907]">
                                    {shop.title ?? "-"}
                                </p>
                                <p className="truncate text-[13px] text-gray-11">
                                    {shop.ownerId?.name ?? "-"}
                                    {shop.ownerId?.email ? ` · ${shop.ownerId.email}` : ""}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Address
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {shop.address ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Created
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">{createdAt}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Description
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {shop.description ?? "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between rounded-[10px] border border-gray-9 px-4 py-3">
                            <span className="text-[13px] font-medium text-gray-8">
                                Shop Status
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${isActive ? "bg-[#CEF4CF] text-[#0F172A]" : "bg-[#FDD5D5] text-[#0F172A]"
                                        }`}
                                >
                                    {isActive ? "Active" : "Suspended"}
                                </span>
                                <span className="rounded-[4px] bg-gray-10 px-1.5 py-0.5 text-[10px] font-medium text-gray-6">
                                    suspend / approve actions coming soon
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-3 text-[13px] font-medium text-gray-8">
                                Shop Analytics
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {stats.map((stat) => {
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

export default ShopDetailModal;
