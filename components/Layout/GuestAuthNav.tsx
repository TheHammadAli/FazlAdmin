"use client";

import { LogIn } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useDictionary } from "@/dictionaries/DictionaryProvider";

type GuestAuthNavProps = {
  onNavigate?: () => void;
  className?: string;
};

function GuestAuthNav({ onNavigate, className = "" }: GuestAuthNavProps) {
  const router = useRouter();
  const path = usePathname();
  const { placeholders } = useDictionary();

  const isSignInActive = path.includes("/signin");

  return (
    <div
      onClick={() => {
        onNavigate?.();
        router.push("/signin");
      }}
      className={`flex cursor-pointer items-center gap-3 py-3 hover:bg-green-3 ${className}`}
    >
      <span
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border ${
          isSignInActive ? "border-green-1 bg-green-4" : "border-[#E5E5E5] bg-white"
        }`}
      >
        <LogIn
          className={`h-4 w-4 ${isSignInActive ? "text-green-1" : "text-gray-8"}`}
          aria-hidden
        />
      </span>
      <h2
        className={`font-normal text-[14px] leading-none ${
          isSignInActive ? "text-green-1" : "text-gray-8"
        }`}
      >
        {placeholders.sign_in}
      </h2>
    </div>
  );
}

export default GuestAuthNav;
