"use client";

import { useRef } from "react";
import Modal from "@/components/Ui/Modals/Modal";
import { useGetWalletTransactionDetailQuery } from "@/store/services/adminService";
import { formatMoneyMinor } from "@/utils/formatMoney";
import type { ApiEnvelope, WalletTransactionRow } from "@/store/services/walletTypes";

type Props = { transactionId: string | null; onClose: () => void };

function refName(ref: WalletTransactionRow["userId"]) {
    if (!ref) return "-";
    if (typeof ref === "string") return ref;
    return ref.name ?? ref.email ?? ref._id;
}

function fmtDateTime(iso?: string) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-10 py-2 text-[13px]">
            <span className="text-gray-11">{label}</span>
            <span className="font-medium text-[#001907]">{value}</span>
        </div>
    );
}

function WalletTransactionDetailModal({ transactionId, onClose }: Props) {
    const open = Boolean(transactionId);
    const modalRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, isFetching } = useGetWalletTransactionDetailQuery(transactionId as string, {
        skip: !open,
    });
    const txn = (data as ApiEnvelope<WalletTransactionRow> | undefined)?.data;
    const loading = isLoading || isFetching;

    if (!open) return null;

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar max-h-[88vh] w-[94vw] max-w-[520px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <h2 className="text-[17px] font-semibold text-black-1">Transaction Detail</h2>
                {loading || !txn ? (
                    <div className="mt-4 space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
                        ))}
                    </div>
                ) : (
                    <div className="mt-3">
                        <Row label="Transaction ID" value={txn.transactionCode ?? txn._id} />
                        <Row label="Type" value={txn.type} />
                        <Row label="User" value={refName(txn.userId)} />
                        <Row label="Merchant / Service Provider" value={refName(txn.merchantId)} />
                        <Row label="Order ID" value={txn.orderId ?? "-"} />
                        <Row label="Original Amount" value={formatMoneyMinor(txn.originalAmountMinor)} />
                        <Row label="Customer Discount" value={`${txn.customerDiscountPercent}% (${formatMoneyMinor(txn.customerDiscountAmountMinor)})`} />
                        <Row label="Final Customer Payment" value={formatMoneyMinor(txn.finalCustomerPaymentMinor)} />
                        <Row label="Merchant Deal" value={`${txn.merchantDealPercent}%`} />
                        <Row label="Fazl Margin" value={`${txn.fazlMarginPercent}% (${formatMoneyMinor(txn.fazlMarginAmountMinor)})`} />
                        <Row label="Merchant Settlement" value={formatMoneyMinor(txn.merchantSettlementAmountMinor)} />
                        <Row label="Payment Method" value={txn.paymentMethod} />
                        <Row label="Sender" value={txn.senderRefId ? refName(txn.senderRefId) : "-"} />
                        <Row label="Receiver" value={txn.receiverRefId ? refName(txn.receiverRefId) : "-"} />
                        <Row label="Status" value={txn.status} />
                        <Row label="Refund Status" value={txn.refundStatus} />
                        <Row label="Date & Time" value={fmtDateTime(txn.createdAt)} />
                        {txn.reason && <Row label="Reason" value={txn.reason} />}

                        {txn.ledgerEntryIds && txn.ledgerEntryIds.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-[13px] font-semibold text-[#001907]">Linked Ledger Entries</h3>
                                <div className="mt-2 space-y-1.5">
                                    {txn.ledgerEntryIds.map((entry) => (
                                        <div
                                            key={entry._id}
                                            className="flex items-center justify-between rounded-[6px] bg-gray-10 px-3 py-2 text-[12px]"
                                        >
                                            <span className="text-gray-8">{entry.ledgerCode ?? entry._id}</span>
                                            <span className="text-gray-11">
                                                {formatMoneyMinor(entry.openingBalanceMinor)} → {formatMoneyMinor(entry.closingBalanceMinor)}
                                            </span>
                                            <span
                                                className={`font-medium ${entry.direction === "credit" ? "text-green-1" : "text-[#E92440]"
                                                    }`}
                                            >
                                                {entry.direction}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default WalletTransactionDetailModal;
