"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CalendarClock, MessageSquare } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetServiceRequestDetailQuery } from "@/store/services/adminService";
import type { BookingStatus } from "@/components/Admin/AdminBookings";
import BookingConversationModal from "@/components/Admin/BookingConversationModal";

type PaymentType = "hourly" | "fixed" | "call_for_price";

type ApiBookingDetail = {
    _id?: string;
    jobCode?: string;
    status?: string;
    jobStatus?: string;
    bookingStatus?: BookingStatus;
    requestedDateTime?: string;
    proposedDateTime?: string;
    message?: string;
    createdAt?: string;
    customer?: { _id?: string; name?: string; email?: string; phone?: string };
    provider?: { _id?: string; name?: string; email?: string; phone?: string };
    service?: { _id?: string; title?: string; price?: number; paymentType?: PaymentType };
};

const STATUS_BADGE_STYLES: Record<BookingStatus, string> = {
    pending: "bg-[#FFF6DD] text-[#946800]",
    accepted: "bg-green-4 text-green-1",
    completed: "bg-[#DFF3E6] text-[#0F7A3D]",
    cancelled: "bg-[#FDD5D5] text-[#C23652]",
};

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatPrice(price?: number, paymentType?: PaymentType) {
    if (paymentType === "call_for_price" || price == null) {
        return "Call for price";
    }
    return `Rs. ${price.toLocaleString()}${paymentType === "hourly" ? " /hr" : ""}`;
}

type BookingDetailModalProps = {
    requestId: string | null;
    onClose: () => void;
};

function BookingDetailModal({ requestId, onClose }: BookingDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const isOpen = Boolean(requestId);
    const [isConversationOpen, setIsConversationOpen] = useState(false);

    const { data, isLoading, isFetching } = useGetServiceRequestDetailQuery(requestId ?? "", {
        skip: !requestId,
    });
    const booking = (data as { data?: ApiBookingDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isOpen) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    const status = booking?.bookingStatus ?? "pending";

    return (
        <Modal editModalRef={modalRef} open={isOpen} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[560px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                            <CalendarClock className="h-5 w-5 text-green-1" strokeWidth={2} />
                            Booking Details
                        </h2>
                        {booking?.jobCode && (
                            <p className="mt-1 text-[12px] font-medium text-gray-11">
                                {booking.jobCode}
                            </p>
                        )}
                    </div>
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
                ) : !booking ? (
                    <p className="mt-6 text-[14px] text-gray-11">Booking not found.</p>
                ) : (
                    <>
                        <div className="mt-5 flex items-center justify-between rounded-[10px] bg-gray-10 p-4">
                            <div className="min-w-0">
                                {booking.service?._id ? (
                                    <Link
                                        href={`/admin/services?viewServiceId=${booking.service._id}`}
                                        className="truncate text-[16px] font-semibold text-green-1 hover:underline"
                                    >
                                        {booking.service?.title ?? "-"}
                                    </Link>
                                ) : (
                                    <p className="truncate text-[16px] font-semibold text-[#001907]">
                                        {booking.service?.title ?? "-"}
                                    </p>
                                )}
                                <p className="truncate text-[13px] text-gray-11">
                                    {formatPrice(booking.service?.price, booking.service?.paymentType)}
                                </p>
                            </div>
                            <span
                                className={`inline-flex shrink-0 rounded-[4px] px-2 py-1 text-[12px] font-medium capitalize ${STATUS_BADGE_STYLES[status]}`}
                            >
                                {capitalize(status)}
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Customer
                                </p>
                                {booking.customer?._id ? (
                                    <Link
                                        href={`/admin/users?viewUserId=${booking.customer._id}`}
                                        className="mt-1 inline-block text-[14px] font-medium text-green-1 hover:underline"
                                    >
                                        {booking.customer?.name ?? "-"}
                                    </Link>
                                ) : (
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {booking.customer?.name ?? "-"}
                                    </p>
                                )}
                                <p className="mt-0.5 text-[12px] text-gray-11">
                                    {booking.customer?.phone ?? booking.customer?.email ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Provider
                                </p>
                                {booking.provider?._id ? (
                                    <Link
                                        href={`/admin/users?viewUserId=${booking.provider._id}`}
                                        className="mt-1 inline-block text-[14px] font-medium text-green-1 hover:underline"
                                    >
                                        {booking.provider?.name ?? "-"}
                                    </Link>
                                ) : (
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {booking.provider?.name ?? "-"}
                                    </p>
                                )}
                                <p className="mt-0.5 text-[12px] text-gray-11">
                                    {booking.provider?.phone ?? booking.provider?.email ?? "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                    Requested For
                                </p>
                                <p className="mt-1 text-[14px] text-[#001907]">
                                    {formatDateTime(booking.requestedDateTime)}
                                </p>
                            </div>
                            {booking.proposedDateTime && (
                                <div>
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Proposed For
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">
                                        {formatDateTime(booking.proposedDateTime)}
                                    </p>
                                </div>
                            )}
                            {booking.message && (
                                <div className="sm:col-span-2">
                                    <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                        Message
                                    </p>
                                    <p className="mt-1 text-[14px] text-[#001907]">{booking.message}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    {booking?.customer?._id && booking?.provider?._id && (
                        <button
                            type="button"
                            onClick={() => setIsConversationOpen(true)}
                            className="inline-flex h-[40px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-green-1 px-4 text-[14px] font-medium text-green-1 transition-colors hover:bg-green-4"
                        >
                            <MessageSquare className="h-4 w-4" strokeWidth={2} />
                            View Conversation
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-gray-9 px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1"
                    >
                        Close
                    </button>
                </div>
            </div>

            <BookingConversationModal
                open={isConversationOpen}
                customerId={booking?.customer?._id}
                providerId={booking?.provider?._id}
                customerName={booking?.customer?.name}
                providerName={booking?.provider?.name}
                onClose={() => setIsConversationOpen(false)}
            />
        </Modal>
    );
}

export default BookingDetailModal;
