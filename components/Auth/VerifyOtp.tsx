"use client";
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import AuthImagePanel from "./AuthImagePanel";
import InputForOtp from "../Ui/InputForOtp";
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from "@/store/services/authService";
import { Body } from "./SendOtp";
import { useAppSelector } from "@/store/store";
import toast from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import Footer from "./Footer";
import DoodleButton from "@/components/Ui/DoodleButton";

function VerifyOtp() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(12);
  const otpInfo = useAppSelector((state) => state.authReducer.otpInfo);
  const { phone, email, type } = otpInfo;

  const [
    sendOtp,
    {
      isLoading: isSendOtpLoading,
      isSuccess: isSendOtpSuccess,
      isError: isSendOtpError,
      data: sendOtpData,
      error: sendOtpError,
    },
  ] = useSendOtpMutation();
  const [
    verifyOtp,
    {
      isLoading: isVerifyLoading,
      isSuccess: isVerifySuccess,
      isError: isVerifyError,
      data: verifyData,
      error: verifyError,
    },
  ] = useVerifyOtpMutation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!otpInfo?.type) {
      window.location.href = "/send-otp";
    } else {
      setMounted(true);
    }
  }, [otpInfo, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = () => {
    let body: Body = {};
    if (type === "email") {
      body = { ...body, email };
    } else {
      body = { ...body, phoneNumber: phone };
    }
    sendOtp(body);
  };

  useEffect(() => {
    if (isSendOtpSuccess) {
      setOtp("");
      toast.success(sendOtpData?.message);
      setTimer(12);
    }
    if (isSendOtpError && "data" in sendOtpError) {
      toast.error(
        (sendOtpError?.data as { message?: string })?.message ||
        "something went wrong!"
      );
    }
  }, [isSendOtpSuccess, isSendOtpError, sendOtpData, sendOtpError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let data: { email?: string; code?: string; phoneNumber?: string } = {
      code: otp,
    };
    if (type === "email") {
      data = { ...data, email: email };
    } else {
      data = { ...data, phoneNumber: phone };
    }
    verifyOtp(data);
  };
  useEffect(() => {
    if (isVerifySuccess) {
      toast.success(verifyData?.message);

      const timer = setTimeout(() => {
        router.push("/set-password");
      }, 500);

      return () => clearTimeout(timer);
    }
    if (isVerifyError && "data" in verifyError) {
      toast.error(
        (verifyError?.data as { message?: string })?.message ||
        "something went wrong!"
      );
    }
  }, [isVerifySuccess, isVerifyError, verifyData, verifyError]);

  if (mounted) {
    return (
      <div className="flex h-screen min-h-[100vh] w-full max-w-full overflow-x-hidden">
        {/* Left section */}
        <AuthImagePanel />
        {/* Right section */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full min-w-0 flex-col justify-between px-5 pt-[80px] sm:px-[50px] lg:w-1/2 xl:px-[150px]"
        >
          <div className="w-full flex flex-col items-center lg:items-start">
            {" "}
            <h1 className="text-black-1 text-center lg:text-left font-medium text-[22px] w-full max-w-[334px]  leading-[30px] ">
              OTP Verification{" "}
            </h1>
            <p className="font-light text-[16px] text-gray-8 text-center lg:text-left">
              Enter the verification code we just sent to
            </p>
            {mounted && (
              <p className=" text-[16px] font-light text-gray-8 text-center lg:text-left">
                {(type === "email" ? email || "" : phone) || "-"}
              </p>
            )}
            <div className="flex justify-center  gap-2 mt-6 w-full max-w-[500px] lg:max-w-full">
              <InputForOtp otp={otp} setOtp={setOtp} />
              {/* <div className="h-[52px] w-[52px] min-w-[52px] bg-gray-4 rounded-[12px] text-[14px] font-normal text-center"></div>
            <div className="h-[52px] hidden lg:block w-[52px] min-w-[52px] bg-gray-4 rounded-[12px] text-[14px] font-normal text-center"></div> */}
            </div>
            <div
              className={`text-center text-[#121212BF] text-[14px] font-semibold mt-5 w-full`}
            >
              00:{timer < 10 ? `0${timer}` : timer} Sec
            </div>
            <div
              className={`font-light text-center lg:text-start text-[13px] text-gray-8 mt-5 leading-none w-full ${timer > 0 && "pointer-events-none opacity-50 "
                }`}
            >
              Didn’t get the code?{" "}
              <span
                onClick={handleSendOtp}
                className="text-green-1 font-normal hover:underline cursor-pointer"
              >
                {" "}
                Click to resend
              </span>
            </div>
            <DoodleButton
              type="submit"
              disabled={otp.length < 6 || isSendOtpLoading}
              className="mt-6 flex h-[52px] w-full max-w-[500px] cursor-pointer items-center justify-center rounded-[12px] bg-green-1 text-[16px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 lg:max-w-full"
            >
              {isVerifyLoading ? (
                <BeatLoader color="white" size={8} />
              ) : (
                "Continue"
              )}
            </DoodleButton>
          </div>
          <div className="mt-14 w-full">
            <Footer />
          </div>
        </form>
      </div>
    );
  } else {
    return null;
  }
}

export default VerifyOtp;
