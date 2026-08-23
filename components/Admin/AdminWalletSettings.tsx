"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import ToggleSwitch from "@/components/Ui/ToggleSwitch";
import { useGetWalletSettingsQuery, useUpdateWalletSettingsMutation } from "@/store/services/adminService";
import type { ApiEnvelope, WalletSettingsData } from "@/store/services/walletTypes";

type FormState = {
    minTopUp: string;
    maxTopUp: string;
    minWithdrawal: string;
    maxWithdrawal: string;
    dailyLimit: string;
    walletStatus: boolean;
    withdrawalStatus: boolean;
};

const EMPTY_FORM: FormState = {
    minTopUp: "",
    maxTopUp: "",
    minWithdrawal: "",
    maxWithdrawal: "",
    dailyLimit: "",
    walletStatus: true,
    withdrawalStatus: true,
};

function toRupees(minor: number) {
    return String(minor / 100);
}

function AdminWalletSettings() {
    const { data, isLoading, isFetching } = useGetWalletSettingsQuery(undefined);
    const [updateSettings, { isLoading: isSaving }] = useUpdateWalletSettingsMutation();
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    useEffect(() => {
        const settings = (data as ApiEnvelope<WalletSettingsData> | undefined)?.data;
        if (!settings) return;
        setForm({
            minTopUp: toRupees(settings.minTopUpAmountMinor),
            maxTopUp: toRupees(settings.maxTopUpAmountMinor),
            minWithdrawal: toRupees(settings.minWithdrawalAmountMinor),
            maxWithdrawal: toRupees(settings.maxWithdrawalAmountMinor),
            dailyLimit: toRupees(settings.dailyTransactionLimitMinor),
            walletStatus: settings.walletStatus,
            withdrawalStatus: settings.withdrawalStatus,
        });
    }, [data]);

    const loading = isLoading || isFetching;

    async function handleSubmit() {
        const minTopUpAmountMinor = Math.round(Number(form.minTopUp) * 100);
        const maxTopUpAmountMinor = Math.round(Number(form.maxTopUp) * 100);
        const minWithdrawalAmountMinor = Math.round(Number(form.minWithdrawal) * 100);
        const maxWithdrawalAmountMinor = Math.round(Number(form.maxWithdrawal) * 100);
        const dailyTransactionLimitMinor = Math.round(Number(form.dailyLimit) * 100);

        if (
            [minTopUpAmountMinor, maxTopUpAmountMinor, minWithdrawalAmountMinor, maxWithdrawalAmountMinor, dailyTransactionLimitMinor].some(
                (n) => !Number.isFinite(n) || n <= 0,
            )
        ) {
            toast.error("All amounts must be valid positive numbers");
            return;
        }
        if (minTopUpAmountMinor > maxTopUpAmountMinor) {
            toast.error("Minimum top-up cannot exceed maximum top-up");
            return;
        }
        if (minWithdrawalAmountMinor > maxWithdrawalAmountMinor) {
            toast.error("Minimum withdrawal cannot exceed maximum withdrawal");
            return;
        }

        try {
            await updateSettings({
                minTopUpAmountMinor,
                maxTopUpAmountMinor,
                minWithdrawalAmountMinor,
                maxWithdrawalAmountMinor,
                dailyTransactionLimitMinor,
                walletStatus: form.walletStatus,
                withdrawalStatus: form.withdrawalStatus,
            }).unwrap();
            toast.success("Wallet settings updated");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-6 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <p className="text-[13px] font-normal text-gray-11">
                        Platform-wide wallet limits and rules — nothing here is hardcoded
                    </p>
                </div>
            </div>

            <div className="bg-white pb-10">
                <div className="container mx-auto max-w-[640px] px-5 pt-6 lg:px-10">
                    {loading ? (
                        <div className="space-y-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-[52px] animate-pulse rounded bg-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-[14px] font-normal text-gray-11">
                                        <ArrowDownCircle className="h-4 w-4" /> Minimum Wallet Top-up (Rs)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.minTopUp}
                                        onChange={(e) => setForm((p) => ({ ...p, minTopUp: e.target.value }))}
                                        className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-[14px] font-normal text-gray-11">
                                        <ArrowUpCircle className="h-4 w-4" /> Maximum Wallet Top-up (Rs)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.maxTopUp}
                                        onChange={(e) => setForm((p) => ({ ...p, maxTopUp: e.target.value }))}
                                        className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-[14px] font-normal text-gray-11">
                                        <ArrowDownCircle className="h-4 w-4" /> Minimum Withdrawal (Rs)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.minWithdrawal}
                                        onChange={(e) => setForm((p) => ({ ...p, minWithdrawal: e.target.value }))}
                                        className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-[14px] font-normal text-gray-11">
                                        <ArrowUpCircle className="h-4 w-4" /> Maximum Withdrawal (Rs)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.maxWithdrawal}
                                        onChange={(e) => setForm((p) => ({ ...p, maxWithdrawal: e.target.value }))}
                                        className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[14px] font-normal text-gray-11">Daily Transaction Limit (Rs)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.dailyLimit}
                                    onChange={(e) => setForm((p) => ({ ...p, dailyLimit: e.target.value }))}
                                    className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-[8px] border border-gray-9 px-4 py-3">
                                <div>
                                    <p className="text-[14px] font-medium text-[#001907]">Wallet Status</p>
                                    <p className="text-[12px] text-gray-11">Global on/off switch for the whole wallet module</p>
                                </div>
                                <ToggleSwitch
                                    checked={form.walletStatus}
                                    ariaLabel="Wallet status"
                                    onChange={() => setForm((p) => ({ ...p, walletStatus: !p.walletStatus }))}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-[8px] border border-gray-9 px-4 py-3">
                                <div>
                                    <p className="text-[14px] font-medium text-[#001907]">Withdrawal Status</p>
                                    <p className="text-[12px] text-gray-11">Global on/off switch for withdrawal requests</p>
                                </div>
                                <ToggleSwitch
                                    checked={form.withdrawalStatus}
                                    ariaLabel="Withdrawal status"
                                    onChange={() => setForm((p) => ({ ...p, withdrawalStatus: !p.withdrawalStatus }))}
                                />
                            </div>
                        </div>
                    )}

                    <DoodleButton
                        type="button"
                        disabled={loading || isSaving}
                        onClick={handleSubmit}
                        className="mt-8 h-[40px] min-w-[140px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? <BeatLoader color="white" size={8} /> : "Save"}
                    </DoodleButton>
                </div>
            </div>
        </section>
    );
}

export default AdminWalletSettings;
