"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { BeatLoader } from "react-spinners";
import Modal from "../Ui/Modals/Modal";
import crossIcon from "@/assets/icons/cross-icon.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import DoodleButton from "@/components/Ui/DoodleButton";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pendingAction: "start_job" | "complete_job" | null;
  isLoading: boolean;
  isActionMatching: boolean;
  startTimerLabel: string;
  endServiceLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

function JobActionConfirmModal({
  open,
  setOpen,
  pendingAction,
  isLoading,
  isActionMatching,
  startTimerLabel,
  endServiceLabel,
  cancelLabel,
  onConfirm,
}: Props) {
  const confirmModalRef = useRef<HTMLDivElement | null>(null);
  const { placeholders } = useDictionary();

  return (
    <Modal
      editModalRef={confirmModalRef}
      open={open}
      setOpen={setOpen}
      centered={true}
    >
      <div className="w-screen max-w-[560px] overflow-hidden rounded-[12px] bg-white">
        <div className="flex items-center justify-between border-b border-gray-9 px-4 py-4">
          <h2 className="text-[15px] font-medium text-black-1">
            {pendingAction === "start_job" ? startTimerLabel : endServiceLabel}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[28px] leading-none text-[#111827] cursor-pointer"
          >
            <Image src={crossIcon} alt="cross-icon" />
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="text-[#4B514F] text-[14px] font-normal leading-relaxed">
            {pendingAction === "start_job"
              ? placeholders[
                  "start_job_confirm_message" as keyof typeof placeholders
                ] ??
                "This will begin tracking time for the service. Make sure you're ready to start before continuing."
              : placeholders[
                  "end_job_confirm_message" as keyof typeof placeholders
                ] ??
                "This will mark the service as completed. Please confirm to continue."}
          </p>
          <div className="mt-8 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-[34px] min-w-[112px] rounded-[6px] border border-green-1 text-green-1 text-[14px] font-normal cursor-pointer"
            >
              {cancelLabel}
            </button>
            <DoodleButton
              type="button"
              onClick={onConfirm}
              className="h-[34px] min-w-[112px] rounded-[6px] bg-green-1 text-white text-[14px] font-normal cursor-pointer"
            >
              {isLoading && isActionMatching ? (
                <div className="flex items-center justify-center">
                  <BeatLoader color="#fff" size={8} />
                </div>
              ) : (
                pendingAction === "start_job" ? startTimerLabel : endServiceLabel
              )}
            </DoodleButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default JobActionConfirmModal;
