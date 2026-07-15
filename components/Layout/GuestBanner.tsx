"use client";

import { useRouter } from "next/navigation";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { useIsGuest } from "@/custom-hooks/useIsGuest";
import DoodleButton from "@/components/Ui/DoodleButton";

function GuestBanner() {
  const isGuest = useIsGuest();
  const router = useRouter();
  const { placeholders, info_messages } = useDictionary();

  if (!isGuest) return null;

  return (
    <div
      role="status"
      className="flex shrink-0 flex-col gap-3 border-b border-green-4 bg-green-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-[13px] font-light leading-snug text-[#030303] sm:text-[14px]">
        {info_messages.guest_banner_message}
      </p>
      <DoodleButton
        type="button"
        onClick={() => router.push("/signin")}
        className="h-[36px] shrink-0 cursor-pointer rounded-lg bg-green-1 px-4 text-[14px] font-medium text-white hover:bg-green-2"
      >
        {placeholders.sign_in}
      </DoodleButton>
    </div>
  );
}

export default GuestBanner;
