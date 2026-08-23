"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { X } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import {
    useCreateRefundMutation,
    useGetRefundDetailQuery,
    useCompleteRefundMutation,
    useRejectRefundMutation,
    useGetWalletAuditLogQuery,
} from "@/store/services/adminService";
import { formatMoneyMinor } from "@/utils/formatMoney";
import type { ApiEnvelope, PaginatedResponse, RefundRow, WalletAuditLogRow } from "@/store/services/walletTypes";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-[#FDEAB8] text-[#946200]",
    completed: "bg-green-4 text-green-1",
    rejected: "bg-[#FDD5D5] text-[#E92440]",
};

function refName(ref: RefundRow["customerId"]) {
    if (!ref) return "-";
    if (typeof ref === "string") return ref;
    return ref.name ?? ref.email ?? "-";
}

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

export function CreateRefundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [createRefund, { isLoading: isSaving }] = useCreateRefundMutation();
    const [originalTransactionId, setOriginalTransactionId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");

    if (!open) return null;

    async function handleSubmit() {
        if (!originalTransactionId.trim()) {
            toast.error("Original Transaction ID is required");
            return;
        }
        const refundAmountMinor = Math.round(Number(amount) * 100);
        if (!Number.isFinite(refundAmountMinor) || refundAmountMinor <= 0) {
            toast.error("Enter a valid refund amount");
            return;
        }
        if (!reason.trim() || reason.trim().length < 3) {
            toast.error("A refund reason is required");
            return;
        }
        try {
            await createRefund({
                originalTransactionId: originalTransactionId.trim(),
                refundAmountMinor,
                refundReason: reason.trim(),
            }).unwrap();
            toast.success("Refund created — complete it to credit the customer wallet");
            setOriginalTransactionId("");
            setAmount("");
            setReason("");
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar relative max-h-[88vh] w-[94vw] max-w-[440px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-gray-11 hover:bg-gray-10 hover:text-[#001907]"
                >
                    <X className="h-5 w-5" strokeWidth={2} />
                </button>
                <h2 className="pr-8 text-[17px] font-semibold text-black-1">Create Refund</h2>
                <p className="mt-1 text-[13px] text-gray-11">
                    Find the Transaction ID on the Transactions page, then complete this refund to credit the wallet.
                </p>

                <div className="mt-4">
                    <label className="text-[12px] text-gray-11">Original Transaction ID</label>
                    <input
                        type="text"
                        value={originalTransactionId}
                        onChange={(e) => setOriginalTransactionId(e.target.value)}
                        placeholder="e.g. 66f0c0f1e1b2c3d4e5f6a7b8"
                        className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                    />
                </div>
                <div className="mt-3">
                    <label className="text-[12px] text-gray-11">Refund Amount (Rs)</label>
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                    />
                </div>
                <div className="mt-3">
                    <label className="text-[12px] text-gray-11">Refund Reason</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-[8px] border border-gray-9 px-3 py-2 text-[14px] outline-none focus:border-green-1"
                    />
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="h-10 flex-1 cursor-pointer rounded-[8px] border border-gray-9 text-[14px] font-medium text-gray-8 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <DoodleButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="h-10 flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:opacity-60"
                    >
                        {isSaving ? <BeatLoader color="white" size={7} /> : "Create Refund"}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export function RefundDetailModal({ refundId, onClose }: { refundId: string | null; onClose: () => void }) {
    const open = Boolean(refundId);
    const modalRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, isFetching } = useGetRefundDetailQuery(refundId as string, { skip: !open });
    const refund = (data as ApiEnvelope<RefundRow> | undefined)?.data;

    const [complete, completeState] = useCompleteRefundMutation();
    const [reject, rejectState] = useRejectRefundMutation();
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const { data: auditData } = useGetWalletAuditLogQuery(
        { page: 1, limit: 10, targetType: "Refund" },
        { skip: !open },
    );
    const allLogs = (auditData as PaginatedResponse<WalletAuditLogRow> | undefined)?.data ?? [];
    const actionLog = allLogs.filter((l) => l.targetId === refundId);

    const busy = completeState.isLoading || rejectState.isLoading;

    if (!open) return null;

    async function handleComplete() {
        if (!refundId) return;
        try {
            await complete({ id: refundId }).unwrap();
            toast.success("Refund completed — ledger credited");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleReject() {
        if (!refundId) return;
        if (!rejectReason.trim() || rejectReason.trim().length < 3) {
            toast.error("A rejection reason is required");
            return;
        }
        try {
            await reject({ id: refundId, reason: rejectReason.trim() }).unwrap();
            toast.success("Refund rejected");
            setRejectMode(false);
            setRejectReason("");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar max-h-[88vh] w-[94vw] max-w-[480px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <h2 className="text-[17px] font-semibold text-black-1">Refund Detail</h2>

                {isLoading || isFetching || !refund ? (
                    <div className="mt-4 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mt-3 space-y-2 text-[13px]">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Refund ID</span>
                                <span className="font-medium text-[#001907]">{refund.refundCode ?? refund._id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Original Transaction</span>
                                <span className="font-medium text-[#001907]">{refund.originalTransactionId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Customer</span>
                                <span className="font-medium text-[#001907]">{refName(refund.customerId)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Merchant</span>
                                <span className="font-medium text-[#001907]">{refName(refund.merchantId)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Refund Amount</span>
                                <span className="font-medium text-[#001907]">{formatMoneyMinor(refund.refundAmountMinor)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Reason</span>
                                <span className="font-medium text-[#001907]">{refund.refundReason}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Status</span>
                                <span className={`rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${STATUS_COLORS[refund.refundStatus] ?? "bg-gray-10 text-gray-8"}`}>
                                    {refund.refundStatus}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Refund Date</span>
                                <span className="font-medium text-[#001907]">
                                    {fmtDateTime((refund as unknown as { createdAt?: string }).createdAt)}
                                </span>
                            </div>
                            {refund.rejectionReason && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-11">Rejection Reason</span>
                                    <span className="font-medium text-[#001907]">{refund.rejectionReason}</span>
                                </div>
                            )}
                        </div>

                        {refund.refundStatus === "pending" && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={busy}
                                    className="h-9 cursor-pointer rounded-[8px] border border-green-1 px-3 text-[13px] font-medium text-green-1 disabled:opacity-60"
                                >
                                    Complete (Credit Wallet)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRejectMode(true)}
                                    disabled={busy}
                                    className="h-9 cursor-pointer rounded-[8px] border border-[#E92440] px-3 text-[13px] font-medium text-[#E92440] disabled:opacity-60"
                                >
                                    Reject
                                </button>
                            </div>
                        )}

                        {rejectMode && (
                            <div className="mt-3 rounded-[8px] border border-gray-9 p-3">
                                <label className="text-[12px] text-gray-11">Rejection reason</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={2}
                                    className="mt-1 w-full rounded-[8px] border border-gray-9 px-3 py-2 text-[14px] outline-none focus:border-green-1"
                                />
                                <div className="mt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRejectMode(false)}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-gray-9 text-[13px]"
                                    >
                                        Cancel
                                    </button>
                                    <DoodleButton
                                        type="button"
                                        onClick={handleReject}
                                        disabled={busy}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[13px] font-medium text-white disabled:opacity-60"
                                    >
                                        {busy ? <BeatLoader color="white" size={6} /> : "Confirm Reject"}
                                    </DoodleButton>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="text-[13px] font-semibold text-[#001907]">Admin / Action Log</h3>
                            {actionLog.length === 0 ? (
                                <p className="mt-1 text-[12px] text-gray-11">No admin actions recorded yet</p>
                            ) : (
                                <div className="mt-2 space-y-1.5">
                                    {actionLog.map((log) => (
                                        <div key={log._id} className="rounded-[6px] bg-gray-10 px-3 py-2 text-[12px]">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-[#001907]">{log.action}</span>
                                                <span className="text-gray-11">{fmtDateTime(log.createdAt)}</span>
                                            </div>
                                            {log.reason && <p className="mt-0.5 text-gray-11">{log.reason}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
