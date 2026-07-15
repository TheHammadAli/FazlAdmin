"use client";
import React, { useEffect, useState } from "react";
import AuthImagePanel from "./AuthImagePanel";
import FinishSignup from "./FinishSignup";
import { useAppSelector } from "@/store/store";
import { useRouter } from "next/navigation";
function Signup() {
  const router = useRouter();
  const otpInfo = useAppSelector((state) => state.authReducer.otpInfo);
  useEffect(() => {
    if (otpInfo?.type === "") {
      router.push("/send-otp");
    } else if (otpInfo?.password === "") {
      router.push("/set-password");
    }
  }, []);
  if (otpInfo?.password !== "" && otpInfo?.type !== "") {
    return (
      <div className="flex min-h-[818px] w-full max-w-full justify-center overflow-x-hidden hide-scrollbar">
        <AuthImagePanel />

        <FinishSignup />
      </div>
    );
  } else {
    return null;
  }
}

export default Signup;
