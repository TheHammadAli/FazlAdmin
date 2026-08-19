"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ClipboardList, Eye, Users, Phone, MessageCircle, Pencil } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetProductDetailQuery } from "@/store/services/adminService";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";
import ListingEditModal, { type EditableListing } from "@/components/Admin/ListingEditModal";

type ApiProductDetail = {
    _id?: string;
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    images?: string[];
    type?: "retail" | "classified";
    createdAt?: string;
    category?: { _id?: string; name?: { en?: string; ur?: string } } | string;
    shopId?: {
        title?: string;
        address?: string;
        ownerId?: { name?: string; phone?: string };
    };
    ownerId?: { name?: string; phone?: string; address?: string };
    parameters?: { name: string; variants: string[] }[];
};

function toEditableListing(product: ApiProductDetail): EditableListing {
    const categoryValue = product.category;
    const categoryId = typeof categoryValue === "string" ? categoryValue : categoryValue?._id ?? "";

    return {
        id: product._id ?? product.id ?? "",
        title: product.title ?? "",
        description: product.description ?? "",
        price: product.price,
        type: product.type ?? "retail",
        category: categoryId,
        images: product.images,
        parameters: product.parameters,
    };
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
        value: "1,284",
        comingSoon: true,
        icon: Eye,
        bg: "bg-[#F1E9FE]",
        color: "text-[#7C4FE0]",
    },
    {
        label: "Unique Visitors",
        value: "892",
        comingSoon: true,
        icon: Users,
        bg: "bg-[#FDE9DF]",
        color: "text-orange",
    },
    {
        label: "Contact Clicks",
        value: "156",
        comingSoon: true,
        icon: Phone,
        bg: "bg-[#FDEAB8]",
        color: "text-[#946200]",
    },
    {
        label: "WhatsApp Clicks",
        value: "74",
        comingSoon: true,
        icon: MessageCircle,
        bg: "bg-green-4",
        color: "text-green-1",
    },
];

type ListingDetailModalProps = {
    productId: string | null;
    onClose: () => void;
};

function ListingDetailModal({ productId, onClose }: ListingDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        setIsEditOpen(false);
    }, [productId]);

    const { data, isLoading, isFetching } = useGetProductDetailQuery(productId ?? "", {
        skip: !productId,
    });
    const product = (data as { data?: ApiProductDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const isOpen = Boolean(productId);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    const createdAt = product?.createdAt
        ? new Date(product.createdAt).toISOString().slice(0, 10)
        : "-";
    const address = product?.shopId?.address ?? product?.ownerId?.address ?? "-";

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
                        <ClipboardList className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Listing Details
                    </h2>
                    <div className="flex shrink-0 items-center gap-2">
                        {product && (
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
                ) : !product ? (
                    <p className="text-[14px] text-gray-11">Listing not found.</p>
                ) : (
                    <>
                        <div className="flex items-center gap-4 rounded-[10px] bg-gray-10 p-4">
                            {product.images?.[0] ? (
                                <Image
                                    src={product.images[0]}
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
                                    {product.title ?? "-"}
                                </p>
                                <p className="truncate text-[13px] text-gray-11">
                                    {product.price != null ? `Rs. ${product.price.toLocaleString()}` : "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Category
                                </p>
                                <p className="mt-1 text-[14px] capitalize text-[#001907]">
                                    {getFeedCategoryLabel(product.category ?? "", "en") || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Type
                                </p>
                                <p className="mt-1 text-[14px] capitalize text-[#001907]">
                                    {product.type ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Shop
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {product.shopId?.title ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Owner
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {product.shopId?.ownerId?.name ?? "-"}
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
                                    Address
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">{address}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Description
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {product.description ?? "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-3 text-[13px] font-medium text-gray-8">
                                Listing Analytics
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

        <ListingEditModal
            open={isEditOpen}
            listing={product ? toEditableListing(product) : null}
            onClose={() => setIsEditOpen(false)}
        />
        </>
    );
}

export default ListingDetailModal;
