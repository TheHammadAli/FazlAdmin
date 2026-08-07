"use client";

import { Mail } from "lucide-react";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";

/** NOTE: hardcoded/local-only for now — no backend endpoint exists yet for Email Logs.
 *  Every automatic email (see EVENT_TYPES below) should eventually be recorded here
 *  by the backend as it's sent. */

type EventType =
    | "Shop Created"
    | "Shop Approved"
    | "Listing Created"
    | "Listing Approved"
    | "Service Created"
    | "Service Approved"
    | "Booking Accepted"
    | "Broadcast Created";

type DeliveryStatus = "Sent" | "Failed" | "Pending";

type EmailLog = {
    id: string;
    emailId: string;
    recipient: string;
    relatedRecordId: string;
    eventType: EventType;
    deliveryStatus: DeliveryStatus;
    createdAt: string;
};

const EVENT_TYPES: EventType[] = [
    "Shop Created",
    "Shop Approved",
    "Listing Created",
    "Listing Approved",
    "Service Created",
    "Service Approved",
    "Booking Accepted",
    "Broadcast Created",
];

const EVENT_META: Record<EventType, { bg: string; color: string }> = {
    "Shop Created": { bg: "bg-green-4", color: "text-green-1" },
    "Shop Approved": { bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    "Listing Created": { bg: "bg-[#F1E9FE]", color: "text-[#7C4FE0]" },
    "Listing Approved": { bg: "bg-[#FDE9DF]", color: "text-orange" },
    "Service Created": { bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
    "Service Approved": { bg: "bg-green-4", color: "text-green-1" },
    "Booking Accepted": { bg: "bg-[#E7F0FF]", color: "text-[#2F6FE4]" },
    "Broadcast Created": { bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
};

const STATUS_META: Record<DeliveryStatus, { bg: string; color: string }> = {
    Sent: { bg: "bg-green-4", color: "text-green-1" },
    Failed: { bg: "bg-[#FDD5D5]", color: "text-[#E92440]" },
    Pending: { bg: "bg-[#FDEAB8]", color: "text-[#946200]" },
};

const SAMPLE_LOGS: EmailLog[] = [
    {
        id: "1",
        emailId: "EML-000001",
        recipient: "aliraza.mart@gmail.com",
        relatedRecordId: "SHP-000012",
        eventType: "Shop Created",
        deliveryStatus: "Sent",
        createdAt: "2026-08-04T09:12:00.000Z",
    },
    {
        id: "2",
        emailId: "EML-000002",
        recipient: "aliraza.mart@gmail.com",
        relatedRecordId: "SHP-000012",
        eventType: "Shop Approved",
        deliveryStatus: "Sent",
        createdAt: "2026-08-04T10:05:00.000Z",
    },
    {
        id: "3",
        emailId: "EML-000003",
        recipient: "sana.electronics@yopmail.com",
        relatedRecordId: "LST-000045",
        eventType: "Listing Created",
        deliveryStatus: "Sent",
        createdAt: "2026-08-04T11:40:00.000Z",
    },
    {
        id: "4",
        emailId: "EML-000004",
        recipient: "sana.electronics@yopmail.com",
        relatedRecordId: "LST-000045",
        eventType: "Listing Approved",
        deliveryStatus: "Failed",
        createdAt: "2026-08-04T12:00:00.000Z",
    },
    {
        id: "5",
        emailId: "EML-000005",
        recipient: "bilal.homeservices@gmail.com",
        relatedRecordId: "SVC-000021",
        eventType: "Service Created",
        deliveryStatus: "Sent",
        createdAt: "2026-08-05T08:30:00.000Z",
    },
    {
        id: "6",
        emailId: "EML-000006",
        recipient: "bilal.homeservices@gmail.com",
        relatedRecordId: "SVC-000021",
        eventType: "Service Approved",
        deliveryStatus: "Pending",
        createdAt: "2026-08-05T09:15:00.000Z",
    },
    {
        id: "7",
        emailId: "EML-000007",
        recipient: "zara.khan@yopmail.com",
        relatedRecordId: "JOB-000010",
        eventType: "Booking Accepted",
        deliveryStatus: "Sent",
        createdAt: "2026-08-05T15:22:00.000Z",
    },
    {
        id: "8",
        emailId: "EML-000008",
        recipient: "hassan.ali@yopmail.com",
        relatedRecordId: "ECH-000034",
        eventType: "Broadcast Created",
        deliveryStatus: "Sent",
        createdAt: "2026-08-06T17:50:00.000Z",
    },
];

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function AdminEmailLogs() {
    const { isSuperAdmin, has } = useCurrentAdminPermissions();
    const canView = isSuperAdmin || has("email-logs");

    if (!canView) {
        return (
            <section className="container mx-auto px-5 py-16 text-center lg:px-10">
                <h1 className="text-[18px] font-semibold text-[#001907]">Not authorized</h1>
                <p className="mt-2 text-[14px] text-gray-11">
                    You don&apos;t have permission to view Email Logs.
                </p>
            </section>
        );
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-7">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="flex items-center gap-2 text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        <Mail className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Email Logs
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Every automatic email sent by the platform is recorded here
                    </p>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5 lg:px-10 mx-auto pt-8">
                    <p className="mb-3 text-[13px] font-medium text-gray-8">Events tracked</p>
                    <div className="flex flex-wrap gap-2">
                        {EVENT_TYPES.map((event) => (
                            <span
                                key={event}
                                className={`inline-flex items-center rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium ${EVENT_META[event].bg} ${EVENT_META[event].color}`}
                            >
                                {event}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="container px-5 lg:px-10 mx-auto mt-6 pb-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Email ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Recipient
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Related Record ID
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Event Type
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Delivery Status
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Date &amp; Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {SAMPLE_LOGS.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-[14px] text-gray-11">
                                            No email logs yet
                                        </td>
                                    </tr>
                                )}

                                {SAMPLE_LOGS.map((log) => {
                                    const eventMeta = EVENT_META[log.eventType];
                                    const statusMeta = STATUS_META[log.deliveryStatus];

                                    return (
                                        <tr key={log.id} className="bg-white">
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {log.emailId}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] text-[#001907]">
                                                {log.recipient}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {log.relatedRecordId}
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${eventMeta.bg} ${eventMeta.color}`}
                                                >
                                                    {log.eventType}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4">
                                                <span
                                                    className={`inline-flex rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${statusMeta.bg} ${statusMeta.color}`}
                                                >
                                                    {log.deliveryStatus}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                {formatDateTime(log.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminEmailLogs;
