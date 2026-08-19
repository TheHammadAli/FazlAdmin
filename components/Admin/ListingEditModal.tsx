"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { ChevronDown, ClipboardList } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { useUpdateProductMutation, useGetAllCategoriesForAdminQuery } from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

type ProductType = "retail" | "classified";

type ApiCategory = {
    _id?: string;
    name?: { en?: string };
};

type CategoriesResponse = { data?: ApiCategory[] };

export type EditableListing = {
    id: string;
    title: string;
    description: string;
    price?: number;
    type: ProductType;
    category?: string;
    images?: string[];
    parameters?: { name: string; variants: string[] }[];
};

type FormErrors = {
    title?: string;
    description?: string;
};

const TYPE_OPTIONS: { value: ProductType; label: string }[] = [
    { value: "retail", label: "Retail" },
    { value: "classified", label: "Classified" },
];

type ListingEditModalProps = {
    open: boolean;
    listing: EditableListing | null;
    onClose: () => void;
    onSuccess?: () => void;
};

function ListingEditModal({ open, listing, onClose, onSuccess }: ListingEditModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [type, setType] = useState<ProductType>("retail");
    const [category, setCategory] = useState("");
    const [newImages, setNewImages] = useState<File[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});

    const [updateProduct, { isLoading: isSubmitting }] = useUpdateProductMutation();
    const { data: categoriesData } = useGetAllCategoriesForAdminQuery({});
    const categories = (categoriesData as CategoriesResponse | undefined)?.data ?? [];

    useEffect(() => {
        if (!open) return;
        setTitle(listing?.title ?? "");
        setDescription(listing?.description ?? "");
        setPrice(listing?.price != null ? String(listing.price) : "");
        setType(listing?.type ?? "retail");
        setCategory(listing?.category ?? "");
        setNewImages([]);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, listing?.id]);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(open) : value;
        if (!nextOpen && !isSubmitting) {
            onClose();
        }
    }

    function handleClose() {
        if (isSubmitting) return;
        onClose();
    }

    async function handleSubmit() {
        if (!listing) return;

        const nextErrors: FormErrors = {};
        if (!title.trim()) nextErrors.title = "Title is required";
        if (!description.trim()) nextErrors.description = "Description is required";
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        if (price.trim()) formData.append("price", price.trim());
        formData.append("type", type);
        if (category) formData.append("category", category);
        // Always resend the existing parameters — the backend throws if this
        // field is omitted entirely, and defaults it to empty otherwise.
        formData.append("parameters", JSON.stringify(listing.parameters ?? []));
        newImages.forEach((file) => formData.append("images", file));

        try {
            const response = await updateProduct({ id: listing.id, body: formData }).unwrap();
            toast.success((response as { message?: string })?.message ?? "Listing updated successfully");
            onSuccess?.();
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    const existingImages = listing?.images ?? [];

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="flex max-h-[90vh] w-[92vw] max-w-[560px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <ClipboardList className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Edit Listing
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 items-center justify-center disabled:opacity-60"
                    >
                        <XMarkIcon className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-5">
                    <div className="mt-1">
                        <label
                            htmlFor="listing-title"
                            className={`text-[14px] font-normal ${errors.title ? "text-red-1" : "text-gray-11"}`}
                        >
                            Title
                        </label>
                        <input
                            id="listing-title"
                            type="text"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                            }}
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.title ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.title && <p className="mt-1 text-[12px] font-normal text-red-1">{errors.title}</p>}
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="listing-description"
                            className={`text-[14px] font-normal ${errors.description ? "text-red-1" : "text-gray-11"}`}
                        >
                            Description
                        </label>
                        <textarea
                            id="listing-description"
                            rows={3}
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value);
                                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                            }}
                            className={`mt-2 w-full resize-none rounded-[8px] border bg-white px-3 py-2 text-[14px] text-[#001907] outline-none ${errors.description ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.description && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.description}</p>
                        )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="listing-price" className="text-[14px] font-normal text-gray-11">
                                Price
                            </label>
                            <input
                                id="listing-price"
                                type="number"
                                min={0}
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="listing-type" className="text-[14px] font-normal text-gray-11">
                                Type
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="listing-type"
                                    value={type}
                                    onChange={(event) => setType(event.target.value as ProductType)}
                                    className="w-full appearance-none border-0 border-b border-gray-9 bg-transparent py-2 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                >
                                    {TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="listing-category" className="text-[14px] font-normal text-gray-11">
                                Category (optional)
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="listing-category"
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className="w-full appearance-none border-0 border-b border-gray-9 bg-transparent py-2 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                >
                                    <option value="">None</option>
                                    {categories.map((option) => (
                                        <option key={option._id} value={option._id}>
                                            {option.name?.en ?? "-"}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <p className="text-[14px] font-normal text-gray-11">Images</p>
                        {existingImages.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {existingImages.map((url, index) => (
                                    <div
                                        key={url + index}
                                        className="h-14 w-14 shrink-0 overflow-hidden rounded-[8px] border border-gray-9"
                                    >
                                        <Image
                                            src={url}
                                            unoptimized
                                            alt=""
                                            width={56}
                                            height={56}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {newImages.length > 0 && (
                            <p className="mt-2 text-[12px] text-gray-11">
                                {newImages.length} new image{newImages.length === 1 ? "" : "s"} selected
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 cursor-pointer text-[13px] font-medium text-green-1"
                        >
                            Add more images
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                                const files = event.target.files ? Array.from(event.target.files) : [];
                                if (files.length === 0) return;
                                setNewImages((prev) => [...prev, ...files]);
                            }}
                        />
                        {existingImages.length === 0 && newImages.length === 0 && (
                            <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-[8px] border border-dashed border-gray-9">
                                <Image src={noImageIcon} alt="no image" className="w-8 object-cover" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-9 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-green-1 px-4 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <DoodleButton
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="h-[40px] min-w-[140px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? <BeatLoader color="white" size={8} /> : "Save Changes"}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default ListingEditModal;
