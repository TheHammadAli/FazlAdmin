"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { Snowflake, Sun, RefreshCcw, X } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import {
    useGetUserWalletDetailQuery,
    useGetMerchantWalletDetailQuery,
    useGetUserWalletLedgerQuery,
    useGetMerchantWalletLedgerQuery,
    useGetMerchantWithdrawalsQuery,
    useAddUserBalanceMutation,
    useAddMerchantBalanceMutation,
    useDeductUserBalanceMutation,
    useDeductMerchantBalanceMutation,
    useFreezeUserWalletMutation,
    useFreezeMerchantWalletMutation,
    useUnfreezeUserWalletMutation,
    useUnfreezeMerchantWalletMutation,
    useRecalculateUserWalletMutation,
    useRecalculateMerchantWalletMutation,
} from "@/store/services/adminService";
import { formatMoneyMinor } from "@/utils/formatMoney";
import type {
    ApiEnvelope,
    PaginatedResponse,
    WalletDetailResponse,
    WalletLedgerEntryRow,
    WithdrawalRow,
    WalletType,
} from "@/store/services/walletTypes";

const LEDGER_LIMIT = 10;

type Props = {
    ownerId: string | null;
    walletType: WalletType;
    onClose: () => void;
};

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function WalletDetailModal({ ownerId, walletType, onClose }: Props) {
    const isUser = walletType === "user";
    const open = Boolean(ownerId);
    const modalRef = useRef<HTMLDivElement>(null);

    const [ledgerPage, setLedgerPage] = useState(1);
    const [actionMode, setActionMode] = useState<"add" | "deduct" | "freeze" | null>(null);
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");

    useEffect(() => {
        setLedgerPage(1);
        setActionMode(null);
        setAmount("");
        setReason("");
    }, [ownerId, walletType]);

    const userDetail = useGetUserWalletDetailQuery(ownerId as string, { skip: !open || !isUser });
    const merchantDetail = useGetMerchantWalletDetailQuery(ownerId as string, { skip: !open || isUser });
    const detailData = (isUser ? userDetail.data : merchantDetail.data) as
        | ApiEnvelope<WalletDetailResponse>
        | undefined;
    const detailLoading = isUser ? userDetail.isLoading || userDetail.isFetching : merchantDetail.isLoading || merchantDetail.isFetching;

    const userLedger = useGetUserWalletLedgerQuery(
        { userId: ownerId, page: ledgerPage, limit: LEDGER_LIMIT },
        { skip: !open || !isUser },
    );
    const merchantLedger = useGetMerchantWalletLedgerQuery(
        { merchantId: ownerId, page: ledgerPage, limit: LEDGER_LIMIT },
        { skip: !open || isUser },
    );
    const ledgerData = (isUser ? userLedger.data : merchantLedger.data) as
        | PaginatedResponse<WalletLedgerEntryRow>
        | undefined;
    const ledgerLoading = isUser ? userLedger.isFetching : merchantLedger.isFetching;

    const withdrawalsQuery = useGetMerchantWithdrawalsQuery(
        { merchantId: ownerId, page: 1, limit: 5 },
        { skip: !open || isUser },
    );
    const withdrawalsData = withdrawalsQuery.data as PaginatedResponse<WithdrawalRow> | undefined;

    const [addUserBalance, addUserState] = useAddUserBalanceMutation();
    const [addMerchantBalance, addMerchantState] = useAddMerchantBalanceMutation();
    const [deductUserBalance, deductUserState] = useDeductUserBalanceMutation();
    const [deductMerchantBalance, deductMerchantState] = useDeductMerchantBalanceMutation();
    const [freezeUserWallet, freezeUserState] = useFreezeUserWalletMutation();
    const [freezeMerchantWallet, freezeMerchantState] = useFreezeMerchantWalletMutation();
    const [unfreezeUserWallet, unfreezeUserState] = useUnfreezeUserWalletMutation();
    const [unfreezeMerchantWallet, unfreezeMerchantState] = useUnfreezeMerchantWalletMutation();
    const [recalculateUserWallet, recalcUserState] = useRecalculateUserWalletMutation();
    const [recalculateMerchantWallet, recalcMerchantState] = useRecalculateMerchantWalletMutation();

    const isSubmitting =
        addUserState.isLoading ||
        addMerchantState.isLoading ||
        deductUserState.isLoading ||
        deductMerchantState.isLoading ||
        freezeUserState.isLoading ||
        freezeMerchantState.isLoading;
    const isUnfreezing = unfreezeUserState.isLoading || unfreezeMerchantState.isLoading;
    const isRecalculating = recalcUserState.isLoading || recalcMerchantState.isLoading;

    if (!open) return null;

    const owner = detailData?.data?.owner;
    const wallet = detailData?.data?.wallet;
    const ledgerRows = ledgerData?.data ?? [];
    const ledgerMeta = ledgerData?.meta;

    function resetAction() {
        setActionMode(null);
        setAmount("");
        setReason("");
    }

    async function handleSubmitAction() {
        if (!ownerId) return;
        const amountMinor = Math.round(Number(amount) * 100);
        if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        if (actionMode !== "freeze" && amountMinor <= 0) {
            toast.error("Amount must be greater than 0");
            return;
        }
        if (!reason.trim() || reason.trim().length < 3) {
            toast.error("A reason (at least 3 characters) is required");
            return;
        }

        try {
            if (actionMode === "add") {
                const fn = isUser ? addUserBalance : addMerchantBalance;
                await fn({ userId: ownerId, merchantId: ownerId, amountMinor, reason: reason.trim() }).unwrap();
                toast.success("Balance added");
            } else if (actionMode === "deduct") {
                const fn = isUser ? deductUserBalance : deductMerchantBalance;
                await fn({ userId: ownerId, merchantId: ownerId, amountMinor, reason: reason.trim() }).unwrap();
                toast.success("Balance deducted");
            } else if (actionMode === "freeze") {
                const fn = isUser ? freezeUserWallet : freezeMerchantWallet;
                await fn({ userId: ownerId, merchantId: ownerId, reason: reason.trim() }).unwrap();
                toast.success("Wallet frozen");
            }
            resetAction();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleUnfreeze() {
        if (!ownerId) return;
        try {
            const fn = isUser ? unfreezeUserWallet : unfreezeMerchantWallet;
            await fn({ userId: ownerId, merchantId: ownerId }).unwrap();
            toast.success("Wallet unfrozen");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    async function handleRecalculate() {
        if (!ownerId) return;
        try {
            const fn = isUser ? recalculateUserWallet : recalculateMerchantWallet;
            await fn({ userId: ownerId, merchantId: ownerId }).unwrap();
            toast.success("Wallet balance recalculated from ledger");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar relative max-h-[88vh] w-[94vw] max-w-[640px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-gray-11 hover:bg-gray-10 hover:text-[#001907]"
                >
                    <X className="h-5 w-5" strokeWidth={2} />
                </button>
                {detailLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-3 pr-8">
                            <div>
                                <h2 className="text-[17px] font-semibold text-black-1">{owner?.name ?? "-"}</h2>
                                <p className="text-[13px] text-gray-11">
                                    {owner?.email ?? "-"} · {owner?.userCode ?? "-"}
                                </p>
                            </div>
                            {wallet?.isFrozen && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-[6px] bg-[#FDD5D5] px-2.5 py-1 text-[12px] font-medium text-[#E92440]">
                                    <Snowflake className="h-3.5 w-3.5" /> Frozen
                                </span>
                            )}
                        </div>

                        {!wallet ? (
                            <p className="mt-5 rounded-[8px] bg-gray-10 px-4 py-6 text-center text-[13px] text-gray-11">
                                No wallet created yet for this {isUser ? "user" : "merchant"} — one will be created
                                automatically on the first balance action.
                            </p>
                        ) : (
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-[8px] border border-green-1 bg-green-4 p-3">
                                    <p className="text-[11px] text-gray-11">Current Balance</p>
                                    <p className="text-[16px] font-semibold text-green-1">
                                        {formatMoneyMinor(wallet.availableBalanceMinor + wallet.pendingBalanceMinor)}
                                    </p>
                                </div>
                                <div className="rounded-[8px] border border-gray-9 p-3">
                                    <p className="text-[11px] text-gray-11">Available Balance</p>
                                    <p className="text-[16px] font-semibold text-[#001907]">
                                        {formatMoneyMinor(wallet.availableBalanceMinor)}
                                    </p>
                                </div>
                                <div className="rounded-[8px] border border-gray-9 p-3">
                                    <p className="text-[11px] text-gray-11">Pending Balance</p>
                                    <p className="text-[16px] font-semibold text-[#001907]">
                                        {formatMoneyMinor(wallet.pendingBalanceMinor)}
                                    </p>
                                </div>
                                <div className="rounded-[8px] border border-gray-9 p-3">
                                    <p className="text-[11px] text-gray-11">Status</p>
                                    <p className="text-[16px] font-semibold text-[#001907]">
                                        {wallet.isFrozen ? "Frozen" : "Active"}
                                    </p>
                                </div>
                                {!isUser && (
                                    <>
                                        <div className="rounded-[8px] border border-gray-9 p-3">
                                            <p className="text-[11px] text-gray-11">Total Received</p>
                                            <p className="text-[16px] font-semibold text-[#001907]">
                                                {formatMoneyMinor(wallet.totalReceivedMinor)}
                                            </p>
                                        </div>
                                        <div className="rounded-[8px] border border-gray-9 p-3">
                                            <p className="text-[11px] text-gray-11">Total Withdrawn</p>
                                            <p className="text-[16px] font-semibold text-[#001907]">
                                                {formatMoneyMinor(wallet.totalWithdrawnMinor)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActionMode("add")}
                                className="h-9 cursor-pointer rounded-[8px] border border-green-1 px-3 text-[13px] font-medium text-green-1 hover:bg-green-4"
                            >
                                Add Balance
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionMode("deduct")}
                                className="h-9 cursor-pointer rounded-[8px] border border-[#E92440] px-3 text-[13px] font-medium text-[#E92440] hover:bg-[#FDD5D5]"
                            >
                                Deduct Balance
                            </button>
                            {wallet?.isFrozen ? (
                                <button
                                    type="button"
                                    onClick={handleUnfreeze}
                                    disabled={isUnfreezing}
                                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border border-gray-9 px-3 text-[13px] font-medium text-gray-8 hover:border-green-1 hover:text-green-1 disabled:opacity-60"
                                >
                                    {isUnfreezing ? <BeatLoader size={5} color="#007781" /> : <Sun className="h-3.5 w-3.5" />}
                                    Unfreeze
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setActionMode("freeze")}
                                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border border-gray-9 px-3 text-[13px] font-medium text-gray-8 hover:border-[#E92440] hover:text-[#E92440]"
                                >
                                    <Snowflake className="h-3.5 w-3.5" />
                                    Freeze
                                </button>
                            )}
                            {wallet && (
                                <button
                                    type="button"
                                    onClick={handleRecalculate}
                                    disabled={isRecalculating}
                                    title="Recalculate balance from the ledger (reconciliation safety net)"
                                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border border-gray-9 px-3 text-[13px] font-medium text-gray-8 hover:border-green-1 hover:text-green-1 disabled:opacity-60"
                                >
                                    {isRecalculating ? <BeatLoader size={5} color="#007781" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                                    Recalculate
                                </button>
                            )}
                        </div>

                        {actionMode && (
                            <div className="mt-4 rounded-[8px] border border-gray-9 p-4">
                                <h3 className="text-[14px] font-semibold text-[#001907]">
                                    {actionMode === "add" ? "Add Balance" : actionMode === "deduct" ? "Deduct Balance" : "Freeze Wallet"}
                                </h3>
                                {actionMode !== "freeze" && (
                                    <div className="mt-3">
                                        <label className="text-[12px] text-gray-11">Amount (Rs)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                                        />
                                    </div>
                                )}
                                <div className="mt-3">
                                    <label className="text-[12px] text-gray-11">Reason (required)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={2}
                                        placeholder="Explain why this action is being taken — recorded in the audit log"
                                        className="mt-1 w-full rounded-[8px] border border-gray-9 px-3 py-2 text-[14px] outline-none focus:border-green-1"
                                    />
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={resetAction}
                                        disabled={isSubmitting}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-gray-9 text-[13px] font-medium text-gray-8 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <DoodleButton
                                        type="button"
                                        onClick={handleSubmitAction}
                                        disabled={isSubmitting}
                                        className="h-9 flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[13px] font-medium text-white disabled:opacity-60"
                                    >
                                        {isSubmitting ? <BeatLoader color="white" size={6} /> : "Confirm"}
                                    </DoodleButton>
                                </div>
                            </div>
                        )}

                        {!isUser && withdrawalsData && withdrawalsData.data.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-[14px] font-semibold text-[#001907]">Recent Withdrawals</h3>
                                <div className="mt-2 space-y-1.5">
                                    {withdrawalsData.data.map((w) => (
                                        <div
                                            key={w._id}
                                            className="flex items-center justify-between rounded-[6px] bg-gray-10 px-3 py-2 text-[12px]"
                                        >
                                            <span className="text-gray-8">{w.withdrawalCode ?? w._id}</span>
                                            <span className="text-gray-11">{formatMoneyMinor(w.requestedAmountMinor)}</span>
                                            <span className="font-medium text-[#001907]">{w.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="text-[14px] font-semibold text-[#001907]">Transaction History (Ledger)</h3>
                            <p className="text-[11px] text-gray-11">Opening balance → transaction → balance after</p>
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full min-w-[520px] text-[12px]">
                                    <thead>
                                        <tr className="text-left text-gray-11">
                                            <th className="py-1.5 pr-3 font-medium">Date</th>
                                            <th className="py-1.5 pr-3 font-medium">Type</th>
                                            <th className="py-1.5 pr-3 font-medium">Amount</th>
                                            <th className="py-1.5 pr-3 font-medium">Opening</th>
                                            <th className="py-1.5 pr-3 font-medium">Closing</th>
                                            <th className="py-1.5 font-medium">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerLoading &&
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td colSpan={6} className="py-1.5">
                                                        <div className="h-4 animate-pulse rounded bg-gray-200" />
                                                    </td>
                                                </tr>
                                            ))}
                                        {!ledgerLoading && ledgerRows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-4 text-center text-gray-11">
                                                    No ledger entries yet
                                                </td>
                                            </tr>
                                        )}
                                        {!ledgerLoading &&
                                            ledgerRows.map((entry) => (
                                                <tr key={entry._id} className="border-t border-gray-10">
                                                    <td className="py-1.5 pr-3 whitespace-nowrap text-gray-11">
                                                        {fmtDateTime(entry.createdAt)}
                                                    </td>
                                                    <td className="py-1.5 pr-3">
                                                        <span
                                                            className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${entry.direction === "credit"
                                                                ? "bg-green-4 text-green-1"
                                                                : "bg-[#FDD5D5] text-[#E92440]"
                                                                }`}
                                                        >
                                                            {entry.direction === "credit" ? "Credit" : "Debit"}
                                                        </span>
                                                    </td>
                                                    <td className="py-1.5 pr-3 whitespace-nowrap text-[#001907]">
                                                        {formatMoneyMinor(entry.amountMinor)}
                                                    </td>
                                                    <td className="py-1.5 pr-3 whitespace-nowrap text-gray-11">
                                                        {formatMoneyMinor(entry.openingBalanceMinor)}
                                                    </td>
                                                    <td className="py-1.5 pr-3 whitespace-nowrap text-gray-11">
                                                        {formatMoneyMinor(entry.closingBalanceMinor)}
                                                    </td>
                                                    <td className="py-1.5 text-gray-11">{entry.reason ?? "-"}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {ledgerMeta && ledgerMeta.totalPages > 1 && (
                                <div className="mt-2 flex items-center justify-center gap-3 text-[12px]">
                                    <button
                                        type="button"
                                        onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                                        disabled={ledgerPage <= 1}
                                        className="rounded-[6px] border border-gray-9 px-2.5 py-1 disabled:opacity-40"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-gray-11">
                                        Page {ledgerMeta.page} of {ledgerMeta.totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setLedgerPage((p) => Math.min(ledgerMeta.totalPages, p + 1))}
                                        disabled={ledgerPage >= ledgerMeta.totalPages}
                                        className="rounded-[6px] border border-gray-9 px-2.5 py-1 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default WalletDetailModal;
