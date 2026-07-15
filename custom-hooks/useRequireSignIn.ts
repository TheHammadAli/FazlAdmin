"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useIsGuest } from "./useIsGuest";

export function useRequireSignIn() {
  const isGuest = useIsGuest();
  const router = useRouter();

  const requireSignIn = useCallback(
    (action?: () => void) => {
      if (isGuest) {
        router.push("/signin");
        return false;
      }
      action?.();
      return true;
    },
    [isGuest, router],
  );

  return { isGuest, requireSignIn };
}
