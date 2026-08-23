"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import Modal from "@/components/Ui/Modals/Modal";
import DoodleButton from "@/components/Ui/DoodleButton";
import { useGetMerchantDealQuery, useUpdateMerchantDealMutation } from "@/store/services/adminService";
import type { ApiEnvelope, MerchantDealResponse } from "@/store/services/walletTypes";

type Props = {
    merchantId: string | null;
    merchantName?: string;
    onClose: () => void;
};

function fmtDate(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
}

function MerchantDealModal({ merchantId, merchantName, onClose }: Props) {
    const open = Boolean(merchantId);
    const modalRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetMerchantDealQuery(merchantId as string, { skip: !open });
    const [updateDeal, { isLoading: isSaving }] = useUpdateMerchantDealMutation();

    const [customerDiscountPercent, setCustomerDiscountPercent] = useState("");
    const [fazlMarginPercent, setFazlMarginPercent] = useState("");
    const [reason, setReason] = useState("");

    const deal = (data as ApiEnvelope<MerchantDealResponse> | undefined)?.data;

    useEffect(() => {
        if (!open) {
            setCustomerDiscountPercent("");
            setFazlMarginPercent("");
            setReason("");
            return;
        }
        setCustomerDiscountPercent(deal?.current ? String(deal.current.customerDiscountPercent) : "");
        setFazlMarginPercent(deal?.current ? String(deal.current.fazlMarginPercent) : "");
    }, [open, deal]);

    if (!open) return null;

    const customerDiscount = Number(customerDiscountPercent) || 0;
    const fazlMargin = Number(fazlMarginPercent) || 0;
    const merchantDealPercent = customerDiscount + fazlMargin;

    async function handleSave() {
        if (customerDiscount < 0 || fazlMargin < 0) {
            toast.error("Percentages cannot be negative");
            return;
        }
        if (merchantDealPercent > 100) {
            toast.error("Customer discount + Fazl margin cannot exceed 100%");
            return;
        }
        try {
            await updateDeal({
                merchantId,
                customerDiscountPercent: customerDiscount,
                fazlMarginPercent: fazlMargin,
                reason: reason.trim() || undefined,
            }).unwrap();
            toast.success("Merchant deal updated");
            setReason("");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    const loading = isLoading || isFetching;

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={() => onClose()} centered>
            <div className="hide-scrollbar max-h-[88vh] w-[94vw] max-w-[560px] overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
                <h2 className="text-[17px] font-semibold text-black-1">Merchant Deal — {merchantName ?? "Merchant"}</h2>
                <p className="mt-1 text-[13px] text-gray-11">
                    Customer only ever sees the Customer Discount. Merchant Deal is auto-calculated.
                </p>

                {loading ? (
                    <div className="mt-4 space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[12px] text-gray-11">Customer Discount (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={customerDiscountPercent}
                                    onChange={(e) => setCustomerDiscountPercent(e.target.value)}
                                    className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] text-gray-11">Fazl Margin (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={fazlMarginPercent}
                                    onChange={(e) => setFazlMarginPercent(e.target.value)}
                                    className="mt-1 h-10 w-full rounded-[8px] border border-gray-9 px-3 text-[14px] outline-none focus:border-green-1"
                                />
                            </div>
                        </div>

                        <div className="mt-3 rounded-[8px] bg-green-4 px-4 py-3">
                            <p className="text-[12px] text-gray-11">Merchant Deal (auto-calculated)</p>
                            <p className="text-[20px] font-semibold text-green-1">{merchantDealPercent}%</p>
                        </div>

                        <div className="mt-3">
                            <label className="text-[12px] text-gray-11">Reason (optional)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={2}
                                placeholder="Why is this deal changing?"
                                className="mt-1 w-full rounded-[8px] border border-gray-9 px-3 py-2 text-[14px] outline-none focus:border-green-1"
                            />
                        </div>

                        <DoodleButton
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="mt-4 h-10 w-full cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:opacity-60"
                        >
                            {isSaving ? <BeatLoader color="white" size={7} /> : "Save New Deal Version"}
                        </DoodleButton>

                        {deal?.history && deal.history.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-[13px] font-semibold text-[#001907]">Deal History</h3>
                                <div className="mt-2 space-y-1.5">
                                    {deal.history.map((d) => (
                                        <div
                                            key={d._id}
                                            className="flex items-center justify-between rounded-[6px] bg-gray-10 px-3 py-2 text-[12px]"
                                        >
                                            <span className="text-gray-8">
                                                {fmtDate(d.effectiveFrom)} → {d.effectiveTo ? fmtDate(d.effectiveTo) : "current"}
                                            </span>
                                            <span className="text-gray-11">
                                                {d.customerDiscountPercent}% + {d.fazlMarginPercent}%
                                            </span>
                                            <span className="font-medium text-[#001907]">{d.merchantDealPercent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}

export default MerchantDealModal;
