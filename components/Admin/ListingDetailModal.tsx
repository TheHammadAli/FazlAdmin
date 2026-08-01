"use client";

import { useRef } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ClipboardList } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetProductDetailQuery } from "@/store/services/adminService";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

type ApiProductDetail = {
    _id?: string;
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    images?: string[];
    type?: string;
    createdAt?: string;
    category?: { name?: { en?: string; ur?: string } } | string;
    shopId?: {
        title?: string;
        ownerId?: { name?: string; phone?: string };
    };
};

type ListingDetailModalProps = {
    productId: string | null;
    onClose: () => void;
};

function ListingDetailModal({ productId, onClose }: ListingDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

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

    return (
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[560px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <ClipboardList className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Listing Details
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
                ) : !product ? (
                    <p className="mt-6 text-[14px] text-gray-11">Listing not found.</p>
                ) : (
                    <>
                        <div className="mt-5 flex items-center gap-4 rounded-[10px] bg-gray-10 p-4">
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
                                    Description
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {product.description ?? "-"}
                                </p>
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

export default ListingDetailModal;
