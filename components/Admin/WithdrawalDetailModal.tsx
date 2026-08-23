"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import {
    useGetWithdrawalDetailQuery,
    useApproveWithdrawalMutation,
    useRejectWithdrawalMutation,
    useMarkWithdrawalProcessingMutation,
    useCompleteWithdrawalMutation,
    useCancelWithdrawalMutation,
} from "@/store/services/adminService";
import { formatMoneyMinor } from "@/utils/formatMoney";
import type { ApiEnvelope, WithdrawalRow } from "@/store/services/walletTypes";

type Props = { withdrawalId: string | null; onClose: () => void };

function refName(ref: WithdrawalRow["merchantId"]) {
    if (!ref) return "-";
    if (typeof ref === "string") return ref;
    return ref.name ?? ref.email ?? "-";
}

function fmtDateTime(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-[#FDEAB8] text-[#946200]",
    approved: "bg-[#E7F0FF] text-[#2F6FE4]",
    processing: "bg-[#F1E9FE] text-[#7C4FE0]",
    completed: "bg-green-4 text-green-1",
    rejected: "bg-[#FDD5D5] text-[#E92440]",
    cancelled: "bg-gray-10 text-gray-8",
};

function WithdrawalDetailModal({ withdrawalId, onClose }: Props) {
    const open = Boolean(withdrawalId);
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetWithdrawalDetailQuery(withdrawalId as string, { skip: !open });
    const withdrawal = (data as ApiEnvelope<WithdrawalRow> | undefined)?.data;

    const [approve, approveState] = useApproveWithdrawalMutation();
    const [reject, rejectState] = useRejectWithdrawalMutation();
    const [markProcessing, processingState] = useMarkWithdrawalProcessingMutation();
    const [complete, completeState] = useCompleteWithdrawalMutation();
    const [cancel, cancelState] = useCancelWithdrawalMutation();

    const [reasonMode, setReasonMode] = useState<"reject" | "cancel" | null>(null);
    const [reasonText, setReasonText] = useState("");
    const [completeMode, setCompleteMode] = useState(false);
    const [externalFee, setExternalFee] = useState("");
    const [externalFeeNote, setExternalFeeNote] = useState("");

    const busy =
        approveState.isLoading ||
        rejectState.isLoading ||
        processingState.isLoading ||
        completeState.isLoading ||
        cancelState.isLoading;

    if (!open) return null;

    async function handleApprove() {
        if (!withdrawalId) return;
        try {
            await approve({ id: withdrawalId }).unwrap();
            toast.success("Withdrawal approved");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleReasonSubmit() {
        if (!withdrawalId) return;
        if (!reasonText.trim() || reasonText.trim().length < 3) {
            toast.error("A reason is required");
            return;
        }
        try {
            if (reasonMode === "reject") {
                await reject({ id: withdrawalId, reason: reasonText.trim() }).unwrap();
                toast.success("Withdrawal rejected");
            } else if (reasonMode === "cancel") {
                await cancel({ id: withdrawalId, reason: reasonText.trim() }).unwrap();
                toast.success("Withdrawal cancelled");
            }
            setReasonMode(null);
            setReasonText("");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleMarkProcessing() {
        if (!withdrawalId) return;
        try {
            await markProcessing({ id: withdrawalId }).unwrap();
            toast.success("Withdrawal moved to processing");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleComplete() {
        if (!withdrawalId) return;
        try {
            await complete({
                id: withdrawalId,
                externalFeeAmountMinor: externalFee.trim() ? Math.round(Number(externalFee) * 100) : undefined,
                externalFeeNote: externalFeeNote.trim() || undefined,
            }).unwrap();
            toast.success("Withdrawal completed");
            setCompleteMode(false);
            setExternalFee("");
            setExternalFeeNote("");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar max-h-[88vh] w-[94vw] max-w-[480px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <h2 className="text-[17px] font-semibold text-black-1">Withdrawal Detail</h2>

                {isLoading || isFetching || !withdrawal ? (
                    <div className="mt-4 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mt-3 space-y-2 text-[13px]">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Withdrawal ID</span>
                                <span className="font-medium text-[#001907]">{withdrawal.withdrawalCode ?? withdrawal._id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Merchant</span>
                                <span className="font-medium text-[#001907]">{refName(withdrawal.merchantId)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Requested Amount</span>
                                <span className="font-medium text-[#001907]">{formatMoneyMinor(withdrawal.requestedAmountMinor)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Available Balance (at request)</span>
                                <span className="font-medium text-[#001907]">
                                    {formatMoneyMinor(withdrawal.availableBalanceSnapshotMinor)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Method</span>
                                <span className="font-medium text-[#001907]">{withdrawal.withdrawalMethod}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Account</span>
                                <span className="font-medium text-[#001907]">
                                    {withdrawal.accountDetails.accountTitle} · {withdrawal.accountDetails.accountNumber}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Status</span>
                                <span className={`rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${STATUS_COLORS[withdrawal.status] ?? "bg-gray-10 text-gray-8"}`}>
                                    {withdrawal.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-11">Request Date</span>
                                <span className="font-medium text-[#001907]">{fmtDateTime((withdrawal as unknown as { createdAt?: string }).createdAt)}</span>
                            </div>
                            {withdrawal.processingDate && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-11">Processing Date</span>
                                    <span className="font-medium text-[#001907]">{fmtDateTime(withdrawal.processingDate)}</span>
                                </div>
                            )}
                            {withdrawal.completedDate && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-11">Completed Date</span>
                                    <span className="font-medium text-[#001907]">{fmtDateTime(withdrawal.completedDate)}</span>
                                </div>
                            )}
                            {withdrawal.externalFeeAmountMinor != null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-11">External Fee (informational)</span>
                                    <span className="font-medium text-[#001907]">{formatMoneyMinor(withdrawal.externalFeeAmountMinor)}</span>
                                </div>
                            )}
                            {withdrawal.rejectionReason && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-11">Rejection Reason</span>
                                    <span className="font-medium text-[#001907]">{withdrawal.rejectionReason}</span>
                                </div>
                            )}
                            {withdrawal.cancellationReason && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-11">Cancellation Reason</span>
                                    <span className="font-medium text-[#001907]">{withdrawal.cancellationReason}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {withdrawal.status === "pending" && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleApprove}
                                        disabled={busy}
                                        className="h-9 cursor-pointer rounded-[8px] border border-green-1 px-3 text-[13px] font-medium text-green-1 disabled:opacity-60"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReasonMode("reject")}
                                        disabled={busy}
                                        className="h-9 cursor-pointer rounded-[8px] border border-[#E92440] px-3 text-[13px] font-medium text-[#E92440] disabled:opacity-60"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {withdrawal.status === "approved" && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleMarkProcessing}
                                        disabled={busy}
                                        className="h-9 cursor-pointer rounded-[8px] border border-[#7C4FE0] px-3 text-[13px] font-medium text-[#7C4FE0] disabled:opacity-60"
                                    >
                                        Mark Processing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCompleteMode(true)}
                                        disabled={busy}
                                        className="h-9 cursor-pointer rounded-[8px] border border-green-1 px-3 text-[13px] font-medium text-green-1 disabled:opacity-60"
                                    >
                                        Complete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReasonMode("reject")}
                                        disabled={busy}
                                        className="h-9 cursor-pointer rounded-[8px] border border-[#E92440] px-3 text-[13px] font-medium text-[#E92440] disabled:opacity-60"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {withdrawal.status === "processing" && (
                                <button
                                    type="button"
                                    onClick={() => setCompleteMode(true)}
                                    disabled={busy}
                                    className="h-9 cursor-pointer rounded-[8px] border border-green-1 px-3 text-[13px] font-medium text-green-1 disabled:opacity-60"
                                >
                                    Complete
                                </button>
                            )}
                            {["pending", "approved", "processing"].includes(withdrawal.status) && (
                                <button
                                    type="button"
                                    onClick={() => setReasonMode("cancel")}
                                    disabled={busy}
                                    className="h-9 cursor-pointer rounded-[8px] border border-gray-9 px-3 text-[13px] font-medium text-gray-8 disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        {reasonMode && (
                            <div className="mt-3 rounded-[8px] border border-gray-9 p-3">
                                <label className="text-[12px] text-gray-11">
                                    {reasonMode === "reject" ? "Rejection reason" : "Cancellation reason"}
                                </label>
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    rows={2}
                                    className="mt-1 w-full rounded-[8px] border border-gray-9 px-3 py-2 text-[14px] outline-none focus:border-green-1"
                                />
                                <div className="mt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setReasonMode(null)}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-gray-9 text-[13px]"
                                    >
                                        Cancel
                                    </button>
                                    <DoodleButton
                                        type="button"
                                        onClick={handleReasonSubmit}
                                        disabled={busy}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[13px] font-medium text-white disabled:opacity-60"
                                    >
                                        {busy ? <BeatLoader color="white" size={6} /> : "Confirm"}
                                    </DoodleButton>
                                </div>
                            </div>
                        )}

                        {completeMode && (
                            <div className="mt-3 rounded-[8px] border border-gray-9 p-3">
                                <p className="text-[12px] text-gray-11">
                                    Fazl&apos;s fee is 0%. External fee below is informational only — never deducted.
                                </p>
                                <label className="mt-2 block text-[12px] text-gray-11">External fee (Rs, optional)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={externalFee}
                                    onChange={(e) => setExternalFee(e.target.value)}
                                    className="mt-1 h-9 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                                />
                                <label className="mt-2 block text-[12px] text-gray-11">Note (optional)</label>
                                <input
                                    type="text"
                                    value={externalFeeNote}
                                    onChange={(e) => setExternalFeeNote(e.target.value)}
                                    className="mt-1 h-9 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                                />
                                <div className="mt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCompleteMode(false)}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-gray-9 text-[13px]"
                                    >
                                        Cancel
                                    </button>
                                    <DoodleButton
                                        type="button"
                                        onClick={handleComplete}
                                        disabled={busy}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[13px] font-medium text-white disabled:opacity-60"
                                    >
                                        {busy ? <BeatLoader color="white" size={6} /> : "Confirm Complete"}
                                    </DoodleButton>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}

export default WithdrawalDetailModal;
