"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import AuthImagePanel from "./AuthImagePanel";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { BeatLoader } from "react-spinners";
import { useForgotPasswordMutation } from "@/store/services/authService";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Footer from "./Footer";
import DoodleButton from "@/components/Ui/DoodleButton";

export type Body = {
  email?: string;
  phoneNumber?: string;
};

export const validatePhone = (phone: string): boolean => {
  const phoneNumber = parsePhoneNumberFromString(phone);
  return phoneNumber ? phoneNumber.isValid() : false;
};

function ForgetPassword() {
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [email, setEmail] = useState("");

  const [forgotPassword, { isLoading, isSuccess, isError, data, error }] =
    useForgotPasswordMutation();

  const handleSendOtp = () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid: boolean = true;
    let body: Body = {};
    if (email.trim().length === 0) {
      setEmailError("Email is required*");
      isValid = false;
    } else if (regex.test(email) === false) {
      setEmailError("Please enter a valid email");
      isValid = false;
    } else {
      setEmailError("");
      body = { email: email };
    }

    if (isValid) {
      forgotPassword(body);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message);
      const timer = setTimeout(() => {
        router.push("/reset-password?token=" + encodeURIComponent(data?.data));
      }, 1500);

      return () => clearTimeout(timer);
    }
    if (isError && "data" in error) {
      toast.error(
        (error?.data as { message?: string })?.message ||
        "something went wrong!"
      );
    }
  }, [isSuccess, isError, data, error]);
  return (
    <div className="flex h-screen min-h-[818px] w-full max-w-full overflow-x-hidden pt-[50px] hide-scrollbar lg:flex lg:pt-0">
      {/* Left section */}
      <AuthImagePanel />
      {/* Right section */}
      <div className="flex h-full w-full min-w-0 flex-col items-center justify-between px-5 sm:px-[50px] lg:w-1/2 lg:items-start lg:pt-[80px] xl:px-[150px]">
        <div className=" w-full flex flex-col   items-center  lg:items-start max-w-[500px] lg:max-w-full">
          <h1 className="text-black-1   font-medium text-[22px] text-center lg:text-start  leading-[30px] ">
            Forgot password
          </h1>
          <p className="font-normal text-[16px] text-gray-8"></p>
          Enter your email.
          {/* email */}
          <div className="space-y-2 mt-5 w-full ">
            <p
              className={`text-[14px] font-normal  ${emailError ? "text-red-1" : "text-gray-8"
                }`}
            >
              Email
            </p>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              className={`h-[28px]  text-[14px] text-gray-8  font-normal focus:outline-none w-full ${emailError ? "border-red-1" : "border-gray-9"
                } border-b-[1px] `}
            />
            {emailError && (
              <p className="text-red-1 text-[14px] font-normal">{emailError}</p>
            )}
          </div>
          <DoodleButton
            onClick={handleSendOtp}
            disabled={isLoading}
            className="mt-6 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-green-1 text-[16px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <BeatLoader color="white" size={8} /> : "Continue"}
          </DoodleButton>
        </div>
        <div className="w-full h-max mb-10 ">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
