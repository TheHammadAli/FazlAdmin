"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import { Megaphone, Send } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { useCreateAnnouncementMutation } from "@/store/services/adminService";

type FormErrors = {
    title?: string;
    message?: string;
};

type AnnouncementFormModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
};

function AnnouncementFormModal({ open, onClose, onSuccess }: AnnouncementFormModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});

    const [createAnnouncement, { isLoading: isSubmitting }] = useCreateAnnouncementMutation();

    useEffect(() => {
        if (!open) return;
        setTitle("");
        setMessage("");
        setErrors({});
    }, [open]);

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
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        try {
            const response = await createAnnouncement({
                title: title.trim(),
                message: message.trim(),
            }).unwrap();
            toast.success((response as { message?: string })?.message ?? "Announcement sent successfully");
            onSuccess?.();
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[560px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Megaphone className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Add Announcement
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

                <p className="mt-3 text-[14px] leading-6 text-gray-11">
                    Send a message that will (eventually) reach every user via in-app and push
                    notification. For now, it will be stored and listed on this page.
                </p>

                <div className="mt-6">
                    <label
                        htmlFor="announcement-title"
                        className={`text-[14px] font-normal ${errors.title ? "text-red-1" : "text-gray-11"}`}
                    >
                        Title
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
                        Message
                    </label>
                    <textarea
                        id="announcement-message"
                        rows={4}
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

                <div className="mt-8 flex justify-end gap-3">
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
                        className="h-[40px] min-w-[160px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <BeatLoader color="white" size={8} />
                        ) : (
                            <>
                                <Send className="h-4 w-4" strokeWidth={2} />
                                Send Announcement
                            </>
                        )}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default AnnouncementFormModal;
