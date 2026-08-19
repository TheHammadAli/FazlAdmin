"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { ChevronDown, Wrench } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { useUpdateServiceMutation, useGetAllCategoriesForAdminQuery } from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

type PaymentType = "hourly" | "fixed" | "call_for_price";

type ApiCategory = {
    _id?: string;
    name?: { en?: string };
};

type CategoriesResponse = { data?: ApiCategory[] };

export type EditableService = {
    id: string;
    title: string;
    description: string;
    price?: number;
    paymentType: PaymentType;
    requiresAppointment?: boolean;
    category?: string;
    images?: string[];
    parameters?: { name: string; variants: string[] }[];
};

type FormErrors = {
    title?: string;
    description?: string;
};

const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
    { value: "fixed", label: "Fixed" },
    { value: "hourly", label: "Hourly" },
    { value: "call_for_price", label: "Call for price" },
];

type ServiceEditModalProps = {
    open: boolean;
    service: EditableService | null;
    onClose: () => void;
    onSuccess?: () => void;
};

function ServiceEditModal({ open, service, onClose, onSuccess }: ServiceEditModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [paymentType, setPaymentType] = useState<PaymentType>("fixed");
    const [requiresAppointment, setRequiresAppointment] = useState(false);
    const [category, setCategory] = useState("");
    const [newImages, setNewImages] = useState<File[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});

    const [updateService, { isLoading: isSubmitting }] = useUpdateServiceMutation();
    const { data: categoriesData } = useGetAllCategoriesForAdminQuery({});
    const categories = (categoriesData as CategoriesResponse | undefined)?.data ?? [];

    useEffect(() => {
        if (!open) return;
        setTitle(service?.title ?? "");
        setDescription(service?.description ?? "");
        setPrice(service?.price != null ? String(service.price) : "");
        setPaymentType(service?.paymentType ?? "fixed");
        setRequiresAppointment(service?.requiresAppointment ?? false);
        setCategory(service?.category ?? "");
        setNewImages([]);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, service?.id]);

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
        if (!service) return;

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
        formData.append("paymentType", paymentType);
        formData.append("requiresAppointment", String(requiresAppointment));
        if (category) formData.append("category", category);
        // Always resend the existing parameters — the backend defaults to an
        // empty/invalid value when this field is omitted, which would wipe them.
        formData.append("parameters", JSON.stringify(service.parameters ?? []));
        newImages.forEach((file) => formData.append("images", file));

        try {
            const response = await updateService({ id: service.id, body: formData }).unwrap();
            toast.success((response as { message?: string })?.message ?? "Service updated successfully");
            onSuccess?.();
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    const existingImages = service?.images ?? [];

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="flex max-h-[90vh] w-[92vw] max-w-[560px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Wrench className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Edit Service
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
                            htmlFor="service-title"
                            className={`text-[14px] font-normal ${errors.title ? "text-red-1" : "text-gray-11"}`}
                        >
                            Title
                        </label>
                        <input
                            id="service-title"
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
                            htmlFor="service-description"
                            className={`text-[14px] font-normal ${errors.description ? "text-red-1" : "text-gray-11"}`}
                        >
                            Description
                        </label>
                        <textarea
                            id="service-description"
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
                            <label htmlFor="service-price" className="text-[14px] font-normal text-gray-11">
                                Price
                            </label>
                            <input
                                id="service-price"
                                type="number"
                                min={0}
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="service-payment-type" className="text-[14px] font-normal text-gray-11">
                                Payment Type
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="service-payment-type"
                                    value={paymentType}
                                    onChange={(event) => setPaymentType(event.target.value as PaymentType)}
                                    className="w-full appearance-none border-0 border-b border-gray-9 bg-transparent py-2 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                >
                                    {PAYMENT_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="service-category" className="text-[14px] font-normal text-gray-11">
                                Category (optional)
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="service-category"
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

                        <div className="flex items-end">
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#001907]">
                                <input
                                    type="checkbox"
                                    checked={requiresAppointment}
                                    onChange={() => setRequiresAppointment((prev) => !prev)}
                                    className="h-4 w-4 accent-green-1"
                                />
                                Requires appointment
                            </label>
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

export default ServiceEditModal;
