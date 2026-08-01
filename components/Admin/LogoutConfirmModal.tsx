"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Ui/Modals/Modal";
import { useAppDispatch } from "@/store/store";
import { beginLogout, logout } from "@/store/reducers/authReducer";

type LogoutConfirmModalProps = {
    open: boolean;
    onClose: () => void;
};

function LogoutConfirmModal({ open, onClose }: LogoutConfirmModalProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const modalRef = useRef<HTMLDivElement>(null);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(open) : value;
        if (!nextOpen) {
            onClose();
        }
    }

    function handleLogout() {
        // beginLogout must dispatch first: it tells baseApi to ignore any 401 from a stray
        // still-mounted query racing this transition, so we can navigate away smoothly instead
        // of falling back to a hard page reload.
        dispatch(beginLogout());
        dispatch(logout());
        router.push("/en/signin");
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
                <h2 className="text-[16px] font-semibold text-black-1">Log out</h2>
                <p className="mt-2 text-[14px] text-gray-8">
                    Are you sure you want to log out of the admin panel?
                </p>
                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default LogoutConfirmModal;
