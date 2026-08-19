"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { ChevronDown, Store } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { useUpdateShopMutation, useGetAllCategoriesForAdminQuery } from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

type ApiCategory = {
    _id?: string;
    name?: { en?: string };
};

type CategoriesResponse = { data?: ApiCategory[] };

export type EditableShop = {
    id: string;
    title: string;
    address: string;
    description: string;
    marketName?: string;
    city?: string;
    area?: string;
    contact?: string;
    category?: string;
    openingHours?: string;
    image?: string;
    banner?: string;
    location?: { type: "Point"; coordinates: [number, number] };
};

type FormErrors = {
    title?: string;
    address?: string;
    description?: string;
};

type ShopEditModalProps = {
    open: boolean;
    shop: EditableShop | null;
    onClose: () => void;
    onSuccess?: () => void;
};

function ShopEditModal({ open, shop, onClose, onSuccess }: ShopEditModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [marketName, setMarketName] = useState("");
    const [city, setCity] = useState("");
    const [area, setArea] = useState("");
    const [contact, setContact] = useState("");
    const [category, setCategory] = useState("");
    const [openingHours, setOpeningHours] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const [updateShop, { isLoading: isSubmitting }] = useUpdateShopMutation();
    const { data: categoriesData } = useGetAllCategoriesForAdminQuery({});
    const categories = (categoriesData as CategoriesResponse | undefined)?.data ?? [];

    useEffect(() => {
        if (!open) return;
        setTitle(shop?.title ?? "");
        setAddress(shop?.address ?? "");
        setDescription(shop?.description ?? "");
        setMarketName(shop?.marketName ?? "");
        setCity(shop?.city ?? "");
        setArea(shop?.area ?? "");
        setContact(shop?.contact ?? "");
        setCategory(shop?.category ?? "");
        setOpeningHours(shop?.openingHours ?? "");
        setImagePreview(shop?.image ?? null);
        setImageFile(null);
        setBannerPreview(shop?.banner ?? null);
        setBannerFile(null);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, shop?.id]);

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
        if (!shop) return;

        const nextErrors: FormErrors = {};
        if (!title.trim()) nextErrors.title = "Title is required";
        if (!address.trim()) nextErrors.address = "Address is required";
        if (!description.trim()) nextErrors.description = "Description is required";
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("address", address.trim());
        formData.append("description", description.trim());
        if (marketName.trim()) formData.append("marketName", marketName.trim());
        if (city.trim()) formData.append("city", city.trim());
        if (area.trim()) formData.append("area", area.trim());
        if (contact.trim()) formData.append("contact", contact.trim());
        if (category) formData.append("category", category);
        if (openingHours.trim()) formData.append("openingHours", openingHours.trim());
        if (shop.location) {
            formData.append("location", JSON.stringify(shop.location));
        }
        if (imageFile) formData.append("image", imageFile);
        if (bannerFile) formData.append("banner", bannerFile);

        try {
            const response = await updateShop({ id: shop.id, body: formData }).unwrap();
            toast.success((response as { message?: string })?.message ?? "Shop updated successfully");
            onSuccess?.();
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="flex max-h-[90vh] w-[92vw] max-w-[560px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Store className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Edit Shop
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
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6FBFB]">
                                {imagePreview ? (
                                    <Image
                                        src={imagePreview}
                                        alt=""
                                        width={48}
                                        height={48}
                                        unoptimized
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Image src={noImageIcon} alt="no image" className="w-10 object-cover" />
                                )}
                            </div>
                            <div>
                                <p className="text-[13px] font-normal text-gray-11">Logo</p>
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="mt-1 cursor-pointer text-[13px] font-medium text-green-1"
                                >
                                    {imagePreview ? "Change" : "Add"}
                                </button>
                            </div>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    setImageFile(file);
                                    setImagePreview(URL.createObjectURL(file));
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#E6FBFB]">
                                {bannerPreview ? (
                                    <Image
                                        src={bannerPreview}
                                        alt=""
                                        width={48}
                                        height={48}
                                        unoptimized
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Image src={noImageIcon} alt="no banner" className="w-10 object-cover" />
                                )}
                            </div>
                            <div>
                                <p className="text-[13px] font-normal text-gray-11">Banner</p>
                                <button
                                    type="button"
                                    onClick={() => bannerInputRef.current?.click()}
                                    className="mt-1 cursor-pointer text-[13px] font-medium text-green-1"
                                >
                                    {bannerPreview ? "Change" : "Add"}
                                </button>
                            </div>
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    setBannerFile(file);
                                    setBannerPreview(URL.createObjectURL(file));
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="shop-title"
                            className={`text-[14px] font-normal ${errors.title ? "text-red-1" : "text-gray-11"}`}
                        >
                            Shop Title
                        </label>
                        <input
                            id="shop-title"
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
                            htmlFor="shop-description"
                            className={`text-[14px] font-normal ${errors.description ? "text-red-1" : "text-gray-11"}`}
                        >
                            Description
                        </label>
                        <textarea
                            id="shop-description"
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
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="shop-address"
                                className={`text-[14px] font-normal ${errors.address ? "text-red-1" : "text-gray-11"}`}
                            >
                                Address
                            </label>
                            <input
                                id="shop-address"
                                type="text"
                                value={address}
                                onChange={(event) => {
                                    setAddress(event.target.value);
                                    if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                                }}
                                className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.address ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                            />
                            {errors.address && (
                                <p className="mt-1 text-[12px] font-normal text-red-1">{errors.address}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="shop-market" className="text-[14px] font-normal text-gray-11">
                                Market Name (optional)
                            </label>
                            <input
                                id="shop-market"
                                type="text"
                                value={marketName}
                                onChange={(event) => setMarketName(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="shop-contact" className="text-[14px] font-normal text-gray-11">
                                Contact Number (optional)
                            </label>
                            <input
                                id="shop-contact"
                                type="text"
                                value={contact}
                                onChange={(event) => setContact(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="shop-city" className="text-[14px] font-normal text-gray-11">
                                City (optional)
                            </label>
                            <input
                                id="shop-city"
                                type="text"
                                value={city}
                                onChange={(event) => setCity(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="shop-area" className="text-[14px] font-normal text-gray-11">
                                Area (optional)
                            </label>
                            <input
                                id="shop-area"
                                type="text"
                                value={area}
                                onChange={(event) => setArea(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="shop-category" className="text-[14px] font-normal text-gray-11">
                                Category (optional)
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="shop-category"
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

                        <div>
                            <label htmlFor="shop-hours" className="text-[14px] font-normal text-gray-11">
                                Opening Hours (optional)
                            </label>
                            <input
                                id="shop-hours"
                                type="text"
                                value={openingHours}
                                onChange={(event) => setOpeningHours(event.target.value)}
                                placeholder="e.g. Mon-Fri, 9:00 AM - 6:00 PM"
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>
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

export default ShopEditModal;
