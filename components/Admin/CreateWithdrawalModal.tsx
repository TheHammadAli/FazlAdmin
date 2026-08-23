"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { X } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import { useCreateWithdrawalMutation, useGetMerchantWalletsQuery } from "@/store/services/adminService";
import { formatMoneyMinor } from "@/utils/formatMoney";
import type { PaginatedResponse, WalletListRow } from "@/store/services/walletTypes";

const WITHDRAWAL_METHODS = ["bank_transfer", "jazzcash", "easypaisa", "other"];
const SEARCH_DEBOUNCE_MS = 300;

type Props = { open: boolean; onClose: () => void };

function CreateWithdrawalModal({ open, onClose }: Props) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [createWithdrawal, { isLoading: isSaving }] = useCreateWithdrawalMutation();

    const [merchantSearchInput, setMerchantSearchInput] = useState("");
    const [merchantSearch, setMerchantSearch] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState<{ id: string; name?: string; availableMinor?: number } | null>(null);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState(WITHDRAWAL_METHODS[0]);
    const [accountTitle, setAccountTitle] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");
    const [iban, setIban] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setMerchantSearch(merchantSearchInput), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [merchantSearchInput]);

    useEffect(() => {
        if (!open) {
            setMerchantSearchInput("");
            setMerchantSearch("");
            setSelectedMerchant(null);
            setAmount("");
            setMethod(WITHDRAWAL_METHODS[0]);
            setAccountTitle("");
            setAccountNumber("");
            setBankName("");
            setIban("");
        }
    }, [open]);

    const { data: merchantResults } = useGetMerchantWalletsQuery(
        { page: 1, limit: 8, search: merchantSearch },
        { skip: !open || !merchantSearch.trim() || Boolean(selectedMerchant) },
    );
    const merchants = (merchantResults as PaginatedResponse<WalletListRow> | undefined)?.data ?? [];

    if (!open) return null;

    async function handleSubmit() {
        if (!selectedMerchant) {
            toast.error("Select a merchant");
            return;
        }
        const amountMinor = Math.round(Number(amount) * 100);
        if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        if (!accountTitle.trim() || !accountNumber.trim()) {
            toast.error("Account title and account number are required");
            return;
        }

        try {
            await createWithdrawal({
                merchantId: selectedMerchant.id,
                requestedAmountMinor: amountMinor,
                withdrawalMethod: method,
                accountDetails: {
                    accountTitle: accountTitle.trim(),
                    accountNumber: accountNumber.trim(),
                    bankName: bankName.trim() || undefined,
                    iban: iban.trim() || undefined,
                },
            }).unwrap();
            toast.success("Withdrawal request recorded");
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar relative max-h-[88vh] w-[94vw] max-w-[480px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-gray-11 hover:bg-gray-10 hover:text-[#001907]"
                >
                    <X className="h-5 w-5" strokeWidth={2} />
                </button>
                <h2 className="pr-8 text-[17px] font-semibold text-black-1">Record Withdrawal Request</h2>
                <p className="mt-1 text-[13px] text-gray-11">On behalf of a merchant / service provider</p>

                <div className="mt-4">
                    <label className="text-[12px] text-gray-11">Merchant</label>
                    {selectedMerchant ? (
                        <div className="mt-1 flex items-center justify-between rounded-[8px] border border-green-1 bg-green-4 px-3 py-2 text-[14px]">
                            <span className="text-[#001907]">{selectedMerchant.name}</span>
                            <button
                                type="button"
                                onClick={() => setSelectedMerchant(null)}
                                className="cursor-pointer text-[12px] text-green-1 hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={merchantSearchInput}
                                onChange={(e) => setMerchantSearchInput(e.target.value)}
                                placeholder="Search merchant by name or email..."
                                className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                            />
                            {merchants.length > 0 && (
                                <div className="mt-1 max-h-[160px] overflow-y-auto rounded-[8px] border border-gray-9">
                                    {merchants.map((m) => {
                                        const id = m._id ?? m.id ?? "";
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedMerchant({
                                                        id,
                                                        name: m.name,
                                                        availableMinor: m.wallet?.availableBalanceMinor,
                                                    })
                                                }
                                                className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-gray-10"
                                            >
                                                <span>{m.name}</span>
                                                <span className="text-gray-11">
                                                    {m.wallet ? formatMoneyMinor(m.wallet.availableBalanceMinor) : "-"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                    {selectedMerchant?.availableMinor !== undefined && (
                        <p className="mt-1 text-[12px] text-gray-11">
                            Available balance: {formatMoneyMinor(selectedMerchant.availableMinor)}
                        </p>
                    )}
                </div>

                <div className="mt-3">
                    <label className="text-[12px] text-gray-11">Requested Amount (Rs)</label>
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
                    <label className="text-[12px] text-gray-11">Withdrawal Method</label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                    >
                        {WITHDRAWAL_METHODS.map((m) => (
                            <option key={m} value={m}>
                                {m.replace("_", " ")}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[12px] text-gray-11">Account Title</label>
                        <input
                            type="text"
                            value={accountTitle}
                            onChange={(e) => setAccountTitle(e.target.value)}
                            className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] text-gray-11">Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] text-gray-11">Bank Name (optional)</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] text-gray-11">IBAN (optional)</label>
                        <input
                            type="text"
                            value={iban}
                            onChange={(e) => setIban(e.target.value)}
                            className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                        />
                    </div>
                </div>

                <p className="mt-3 text-[11px] text-gray-11">
                    Fazl&apos;s platform fee is always 0%. Any external bank/provider fee is recorded separately when the
                    withdrawal is completed — it is never deducted here.
                </p>

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
                        {isSaving ? <BeatLoader color="white" size={7} /> : "Record Request"}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default CreateWithdrawalModal;
