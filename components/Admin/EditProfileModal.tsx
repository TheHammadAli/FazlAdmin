"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { UserCog } from "lucide-react";
import Modal from "@/components/Ui/Modals/Modal";
import { useUpdateProfileMutation, useGetOwnProfileQuery } from "@/store/services/profileService";

type ApiUserDetail = {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
};

type EditProfileModalProps = {
    open: boolean;
    onClose: () => void;
};

function EditProfileModal({ open, onClose }: EditProfileModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, isFetching } = useGetOwnProfileQuery(undefined, { skip: !open });
    const user = (data as { data?: ApiUserDetail } | undefined)?.data;
    const loading = isLoading || isFetching;

    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

    useEffect(() => {
        if (user) {
            setPhone(user.phone ?? "");
            setAddress(user.address ?? "");
        }
    }, [user]);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(open) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        try {
            const response = await updateProfile({ phone, address }).unwrap();
            toast.success(response?.message ?? "Profile updated successfully");
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[480px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <UserCog className="h-5 w-5 text-green-1" strokeWidth={2} />
                        Edit Profile
                    </h2>
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
                    <div className="mt-6 h-64 animate-pulse rounded-[12px] bg-gray-200" />
                ) : (
                    <form onSubmit={handleSubmit} className="mt-5">
                        <div>
                            <label className="text-[14px] font-normal text-gray-11">Name</label>
                            <input
                                type="text"
                                value={user?.name ?? ""}
                                disabled
                                className="mt-2 w-full cursor-not-allowed rounded-[8px] border border-gray-9 bg-gray-10 px-3 py-2 text-[14px] text-gray-11 outline-none"
                            />
                        </div>
                        <div className="mt-5">
                            <label className="text-[14px] font-normal text-gray-11">Email</label>
                            <input
                                type="text"
                                value={user?.email ?? ""}
                                disabled
                                className="mt-2 w-full cursor-not-allowed rounded-[8px] border border-gray-9 bg-gray-10 px-3 py-2 text-[14px] text-gray-11 outline-none"
                            />
                        </div>
                        <div className="mt-5">
                            <label htmlFor="edit-profile-phone" className="text-[14px] font-normal text-gray-11">
                                Phone
                            </label>
                            <input
                                id="edit-profile-phone"
                                type="text"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="+92 300 1234567"
                                className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>
                        <div className="mt-5">
                            <label htmlFor="edit-profile-address" className="text-[14px] font-normal text-gray-11">
                                Address
                            </label>
                            <input
                                id="edit-profile-address"
                                type="text"
                                value={address}
                                onChange={(event) => setAddress(event.target.value)}
                                placeholder="Street, City"
                                className="mt-2 w-full rounded-[8px] border border-gray-9 bg-white px-3 py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? <BeatLoader color="white" size={8} /> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

export default EditProfileModal;
