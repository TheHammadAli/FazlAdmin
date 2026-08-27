"use client";

import { useRef, useState } from "react";
import { X, Eye } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import Pagination from "@/components/Ui/Pagination";
import { useGetAnnouncementViewersQuery } from "@/store/services/adminService";

const PAGE_LIMIT = 20;

type ViewerUser = { _id?: string; name?: string; email?: string };
type ViewerRow = { createdAt?: string; user?: ViewerUser };
type ViewersResponse = {
    data?: ViewerRow[];
    meta?: { total?: number; totalPages?: number };
};

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function AnnouncementViewersModal({
    open,
    onClose,
    announcementId,
    announcementTitle,
}: {
    open: boolean;
    onClose: () => void;
    announcementId: string;
    announcementTitle: string;
}) {
    const [page, setPage] = useState(1);
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetAnnouncementViewersQuery(
        { announcementId, page, limit: PAGE_LIMIT },
        { skip: !open || !announcementId },
    );

    const response = data as ViewersResponse | undefined;
    const rows = response?.data ?? [];
    const loading = isLoading || isFetching;
    const pageCount = response?.meta?.totalPages ?? 1;

    function handleClose() {
        setPage(1);
        onClose();
    }

    return (
        <Modal
            editModalRef={modalRef}
            open={open}
            setOpen={(value) => {
                const nextOpen = typeof value === "function" ? value(open) : value;
                if (!nextOpen) handleClose();
            }}
            centered
        >
            <div className="hide-scrollbar w-[92vw] max-w-[460px] rounded-[12px] bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="flex items-center gap-1.5 text-[16px] font-semibold text-[#001907]">
                            <Eye className="h-4 w-4 text-green-1" strokeWidth={2} />
                            Views
                        </h2>
                        <p className="mt-0.5 truncate text-[12px] text-gray-11">{announcementTitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                    >
                        <X className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                <div className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto">
                    {loading &&
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={`sk-${i}`} className="h-12 w-full animate-pulse rounded-[8px] bg-gray-200" />
                        ))}

                    {!loading && rows.length === 0 && (
                        <p className="py-8 text-center text-[14px] text-gray-11">No one has viewed this yet</p>
                    )}

                    {!loading &&
                        rows.map((row, index) => (
                            <div
                                key={row.user?._id ?? index}
                                className="flex items-center justify-between gap-3 rounded-[8px] border-b border-gray-10 py-2.5 last:border-b-0"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[14px] font-normal text-[#001907]">
                                        {row.user?.name ?? "-"}
                                    </p>
                                    <p className="truncate text-[12px] text-gray-11">{row.user?.email ?? "-"}</p>
                                </div>
                                <span className="shrink-0 whitespace-nowrap text-[12px] text-gray-11">
                                    {fmtDateTime(row.createdAt)}
                                </span>
                            </div>
                        ))}
                </div>

                {!loading && pageCount > 1 && (
                    <Pagination pageCount={pageCount} currentPage={page} onPageChange={setPage} />
                )}
            </div>
        </Modal>
    );
}

export default AnnouncementViewersModal;
