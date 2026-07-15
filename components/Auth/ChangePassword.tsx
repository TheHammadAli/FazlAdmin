"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { useUpdateProfileMutation } from "@/store/services/profileService";
import { useAppSelector } from "@/store/store";
import { i18n } from "@/i18n.config";
import PasswordEntryForm from "./PasswordEntryForm";
import { getUserId } from "@/utils/getUserId";

const PASSWORD_CHANGED_TOAST_MS = 1000;

function ChangePassword() {
  const router = useRouter();
  const pathname = usePathname();
  const { placeholders } = useDictionary();
  const userId = getUserId();
  const [updateProfile, { isLoading, isSuccess, isError, data, error }] =
    useUpdateProfileMutation();
  const hasHandledSuccess = useRef(false);

  const locale =
    pathname?.split("/")[1] &&
      i18n.locales.includes(
        pathname.split("/")[1] as (typeof i18n.locales)[number],
      )
      ? pathname.split("/")[1]
      : i18n.defaultLocale;

  useEffect(() => {
    if (isSuccess && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      const message =
        data?.message || placeholders.password_changed_successfully;

      toast.success(message, { duration: PASSWORD_CHANGED_TOAST_MS });

      const timer = setTimeout(() => {
        router.push(`/${locale}/profile`);
      }, PASSWORD_CHANGED_TOAST_MS);

      return () => clearTimeout(timer);
    }
    if (isError && error && "data" in error) {
      toast.error(
        (error?.data as { message?: string })?.message ||
        "something went wrong!",
      );
    }
  }, [
    isSuccess,
    isError,
    data,
    error,
    router,
    locale,
    placeholders.password_changed_successfully,
  ]);

  const handleSubmit = (password: string) => {
    if (!userId) {
      toast.error("something went wrong!");
      return;
    }

    const formData = new FormData();
    formData.append("password", password);
    updateProfile({ formData, id: userId });
  };

  return (
    <PasswordEntryForm
      variant="change"
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}

export default ChangePassword;
