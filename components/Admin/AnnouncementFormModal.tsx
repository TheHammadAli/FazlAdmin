"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { ChevronDown, Megaphone, Save, Send, Clock, Video as VideoIcon } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import {
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useGetAllCategoriesForAdminQuery,
} from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

type AnnouncementStatus = "draft" | "scheduled" | "sent";
type Priority = "low" | "medium" | "high";

type ApiCategory = {
    _id?: string;
    name?: { en?: string };
};

type CategoriesResponse = { data?: ApiCategory[] };

type FormErrors = {
    title?: string;
    message?: string;
    scheduledAt?: string;
};

export type EditableAnnouncement = {
    id: string;
    title: string;
    message: string;
    image?: string;
    video?: string;
    targetAudience?: string[];
    category?: string;
    location?: string;
    ctaLabel?: string;
    ctaDestination?: string;
    scheduledAt?: string;
    expiresAt?: string;
    priority?: Priority;
};

export type AnnouncementFormMode = "add" | { type: "edit"; announcement: EditableAnnouncement };

/** Announcement videos we host ourselves always live under this S3 key prefix — anything else is a pasted link (e.g. YouTube). */
function isUploadedAnnouncementVideo(url?: string): boolean {
    return Boolean(url) && url!.includes("/announcements/videos/");
}

function toDatetimeLocalValue(iso?: string): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const STATUS_OPTIONS: { value: AnnouncementStatus; label: string; icon: typeof Save }[] = [
    { value: "draft", label: "Save as Draft", icon: Save },
    { value: "scheduled", label: "Schedule", icon: Clock },
    { value: "sent", label: "Send Now", icon: Send },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

type AnnouncementFormModalProps = {
    open: boolean;
    mode?: AnnouncementFormMode;
    onClose: () => void;
    onSuccess?: () => void;
};

function AnnouncementFormModal({ open, mode = "add", onClose, onSuccess }: AnnouncementFormModalProps) {
    const isEdit = mode !== "add";
    const editAnnouncement = isEdit ? mode.announcement : null;
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoLink, setVideoLink] = useState("");
    const [targetBuyers, setTargetBuyers] = useState(false);
    const [targetSellers, setTargetSellers] = useState(false);
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [ctaLabel, setCtaLabel] = useState("");
    const [ctaDestination, setCtaDestination] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [status, setStatus] = useState<AnnouncementStatus>("sent");
    const [errors, setErrors] = useState<FormErrors>({});

    const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
    const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
    const isSubmitting = isCreating || isUpdating;
    const { data: categoriesData } = useGetAllCategoriesForAdminQuery({});
    const categories = (categoriesData as CategoriesResponse | undefined)?.data ?? [];

    useEffect(() => {
        if (!open) return;
        setTitle(editAnnouncement?.title ?? "");
        setMessage(editAnnouncement?.message ?? "");
        setImagePreview(editAnnouncement?.image ?? null);
        setImageFile(null);
        const existingVideo = editAnnouncement?.video ?? "";
        const existingVideoIsUpload = isUploadedAnnouncementVideo(existingVideo);
        setVideoPreview(existingVideoIsUpload ? existingVideo : null);
        setVideoFile(null);
        setVideoLink(existingVideoIsUpload ? "" : existingVideo);
        setTargetBuyers(editAnnouncement?.targetAudience?.includes("buyer") ?? false);
        setTargetSellers(editAnnouncement?.targetAudience?.includes("seller") ?? false);
        setCategory(editAnnouncement?.category ?? "");
        setLocation(editAnnouncement?.location ?? "");
        setCtaLabel(editAnnouncement?.ctaLabel ?? "");
        setCtaDestination(editAnnouncement?.ctaDestination ?? "");
        setScheduledAt(toDatetimeLocalValue(editAnnouncement?.scheduledAt));
        setExpiresAt(toDatetimeLocalValue(editAnnouncement?.expiresAt));
        setPriority(editAnnouncement?.priority ?? "medium");
        setStatus(editAnnouncement ? "draft" : "sent");
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editAnnouncement?.id]);

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
        const nextErrors: FormErrors = {};
        if (!title.trim()) {
            nextErrors.title = "Title is required";
        }
        if (!message.trim()) {
            nextErrors.message = "Message is required";
        }
        if (status === "scheduled" && !scheduledAt) {
            nextErrors.scheduledAt = "Schedule date & time is required";
        }
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const targetAudience = [
            ...(targetBuyers ? ["buyer"] : []),
            ...(targetSellers ? ["seller"] : []),
        ];

        const fields: Record<string, string> = {
            title: title.trim(),
            message: message.trim(),
            targetAudience: JSON.stringify(targetAudience),
            priority,
            status,
        };
        if (category) fields.category = category;
        if (location.trim()) fields.location = location.trim();
        if (ctaLabel.trim()) fields.ctaLabel = ctaLabel.trim();
        if (ctaDestination.trim()) fields.ctaDestination = ctaDestination.trim();
        if (!videoFile && videoLink.trim()) fields.video = videoLink.trim();
        if (scheduledAt) fields.scheduledAt = new Date(scheduledAt).toISOString();
        if (expiresAt) fields.expiresAt = new Date(expiresAt).toISOString();

        const body = imageFile || videoFile
            ? (() => {
                const formData = new FormData();
                Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
                if (imageFile) formData.append("image", imageFile);
                if (videoFile) formData.append("video", videoFile);
                return formData;
            })()
            : fields;

        try {
            const response = editAnnouncement
                ? await updateAnnouncement({ id: editAnnouncement.id, body }).unwrap()
                : await createAnnouncement(body).unwrap();
            toast.success((response as { message?: string })?.message ?? "Announcement saved successfully");
            onSuccess?.();
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    const submitLabel =
        status === "draft" ? "Save as Draft" : status === "scheduled" ? "Schedule Announcement" : "Send Announcement";
    const SubmitIcon = status === "draft" ? Save : status === "scheduled" ? Clock : Send;

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="flex max-h-[90vh] w-[92vw] max-w-[560px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pt-6 pb-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Megaphone className="h-5 w-5 text-green-1" strokeWidth={2} />
                        {isEdit ? "Edit Announcement" : "Add Announcement"}
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
                    <div>
                        <p className="text-[14px] font-normal text-gray-11">Delivery</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {STATUS_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isActive = status === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setStatus(option.value);
                                            if (errors.scheduledAt) {
                                                setErrors((prev) => ({ ...prev, scheduledAt: undefined }));
                                            }
                                        }}
                                        className={`flex cursor-pointer flex-col items-center gap-1 rounded-[8px] border px-2 py-2.5 text-[12px] font-medium transition-colors ${isActive
                                            ? "border-green-1 bg-green-4 text-green-1"
                                            : "border-gray-9 text-gray-8 hover:border-green-1"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" strokeWidth={2} />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="announcement-title"
                            className={`text-[14px] font-normal ${errors.title ? "text-red-1" : "text-gray-11"}`}
                        >
                            Notification Title
                        </label>
                        <input
                            id="announcement-title"
                            type="text"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                if (errors.title) {
                                    setErrors((prev) => ({ ...prev, title: undefined }));
                                }
                            }}
                            placeholder="e.g. New feature: Echo Broadcasts"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.title ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.title}</p>
                        )}
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="announcement-message"
                            className={`text-[14px] font-normal ${errors.message ? "text-red-1" : "text-gray-11"}`}
                        >
                            Notification Message
                        </label>
                        <textarea
                            id="announcement-message"
                            rows={3}
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                                if (errors.message) {
                                    setErrors((prev) => ({ ...prev, message: undefined }));
                                }
                            }}
                            placeholder="Write the announcement message..."
                            className={`mt-2 w-full resize-none rounded-[8px] border bg-white px-3 py-2 text-[14px] text-[#001907] outline-none ${errors.message ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.message && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.message}</p>
                        )}
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB]">
                            {imagePreview ? (
                                <Image
                                    src={imagePreview}
                                    alt=""
                                    width={24}
                                    height={24}
                                    unoptimized
                                    className="h-6 w-6 object-contain"
                                />
                            ) : (
                                <Image src={noImageIcon} alt="no image" className="w-10 object-cover" />
                            )}
                        </div>
                        <div>
                            <p className="text-[14px] font-normal text-gray-11">Image / Icon (optional)</p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-1 cursor-pointer text-[13px] font-medium text-green-1"
                            >
                                {imagePreview ? "Change image" : "Add image"}
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
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

                    <div className="mt-5">
                        <p className="text-[14px] font-normal text-gray-11">Video (optional)</p>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB]">
                                {videoPreview ? (
                                    <video src={videoPreview} className="h-full w-full rounded-full object-cover" muted />
                                ) : (
                                    <VideoIcon className="h-5 w-5 text-green-1" strokeWidth={2} />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    className="cursor-pointer text-[13px] font-medium text-green-1"
                                >
                                    {videoPreview ? "Change video" : "Upload video"}
                                </button>
                                {videoPreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVideoFile(null);
                                            setVideoPreview(null);
                                            if (videoInputRef.current) videoInputRef.current.value = "";
                                        }}
                                        className="cursor-pointer text-[13px] font-medium text-red-1"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        {!videoPreview && (
                            <div className="mt-3">
                                <label htmlFor="announcement-video-link" className="text-[13px] font-normal text-gray-11">
                                    Or paste a video link (e.g. YouTube)
                                </label>
                                <input
                                    id="announcement-video-link"
                                    type="text"
                                    value={videoLink}
                                    onChange={(event) => setVideoLink(event.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="mt-1 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                />
                            </div>
                        )}

                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                setVideoFile(file);
                                setVideoLink("");
                                setVideoPreview(URL.createObjectURL(file));
                            }}
                        />
                    </div>

                    <div className="mt-5">
                        <p className="text-[14px] font-normal text-gray-11">Target Audience</p>
                        <div className="mt-2 flex flex-wrap gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#001907]">
                                <input
                                    type="checkbox"
                                    checked={targetBuyers}
                                    onChange={() => setTargetBuyers((prev) => !prev)}
                                    className="h-4 w-4 accent-green-1"
                                />
                                Buyers
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#001907]">
                                <input
                                    type="checkbox"
                                    checked={targetSellers}
                                    onChange={() => setTargetSellers((prev) => !prev)}
                                    className="h-4 w-4 accent-green-1"
                                />
                                Sellers
                            </label>
                        </div>
                        <p className="mt-1 text-[12px] text-gray-11">Leave both unchecked to target all users.</p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="announcement-category" className="text-[14px] font-normal text-gray-11">
                                Category (optional)
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="announcement-category"
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
                            <label htmlFor="announcement-location" className="text-[14px] font-normal text-gray-11">
                                Location / Area (optional)
                            </label>
                            <input
                                id="announcement-location"
                                type="text"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="e.g. Lahore, Gulberg"
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="announcement-cta-label" className="text-[14px] font-normal text-gray-11">
                                CTA Button (optional)
                            </label>
                            <input
                                id="announcement-cta-label"
                                type="text"
                                value={ctaLabel}
                                onChange={(event) => setCtaLabel(event.target.value)}
                                placeholder="e.g. View Offer"
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="announcement-cta-destination" className="text-[14px] font-normal text-gray-11">
                                CTA Destination / Screen (optional)
                            </label>
                            <input
                                id="announcement-cta-destination"
                                type="text"
                                value={ctaDestination}
                                onChange={(event) => setCtaDestination(event.target.value)}
                                placeholder="e.g. listing/123 or a URL"
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        {status === "scheduled" && (
                            <div>
                                <label
                                    htmlFor="announcement-scheduled-at"
                                    className={`text-[14px] font-normal ${errors.scheduledAt ? "text-red-1" : "text-gray-11"}`}
                                >
                                    Schedule Date & Time
                                </label>
                                <input
                                    id="announcement-scheduled-at"
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(event) => {
                                        setScheduledAt(event.target.value);
                                        if (errors.scheduledAt) {
                                            setErrors((prev) => ({ ...prev, scheduledAt: undefined }));
                                        }
                                    }}
                                    className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.scheduledAt ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                                />
                                {errors.scheduledAt && (
                                    <p className="mt-1 text-[12px] font-normal text-red-1">{errors.scheduledAt}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="announcement-expires-at" className="text-[14px] font-normal text-gray-11">
                                Expiry Date & Time (optional)
                            </label>
                            <input
                                id="announcement-expires-at"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(event) => setExpiresAt(event.target.value)}
                                className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="announcement-priority" className="text-[14px] font-normal text-gray-11">
                                Priority
                            </label>
                            <div className="relative mt-2">
                                <select
                                    id="announcement-priority"
                                    value={priority}
                                    onChange={(event) => setPriority(event.target.value as Priority)}
                                    className="w-full appearance-none border-0 border-b border-gray-9 bg-transparent py-2 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                >
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                            </div>
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
                        className="h-[40px] min-w-[170px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <BeatLoader color="white" size={8} />
                        ) : (
                            <>
                                <SubmitIcon className="h-4 w-4" strokeWidth={2} />
                                {submitLabel}
                            </>
                        )}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default AnnouncementFormModal;
