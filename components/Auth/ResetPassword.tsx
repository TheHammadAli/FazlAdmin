"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "@/store/services/authService";
import PasswordEntryForm from "./PasswordEntryForm";

function ResetPassword() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();
  const [resetPassword, { isLoading, isSuccess, isError, data, error }] =
    useResetPasswordMutation();

  useEffect(() => {
    if (!token) {
      router.push("/forget-password");
    }
  }, [token, router]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message);
      const timer = setTimeout(() => {
        router.push("/signin");
      }, 1500);

      return () => clearTimeout(timer);
    }
    if (isError && error && "data" in error) {
      toast.error(
        (error?.data as { message?: string })?.message ||
          "something went wrong!",
      );
    }
  }, [isSuccess, isError, data, error, router]);

  if (!token) {
    return null;
  }

  return (
    <PasswordEntryForm
      variant="reset"
      isLoading={isLoading}
      onSubmit={(password) =>
        resetPassword({ token, newPassword: password })
      }
    />
  );
}

export default ResetPassword;
