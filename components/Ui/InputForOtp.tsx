"use client";
import React, { useState } from "react";
import OtpInput from "react-otp-input";
type InputForOtpProps = {
  otp: string;
  setOtp: (value: string) => void;
};

function InputForOtp({ otp, setOtp }: InputForOtpProps) {
  return (
    <OtpInput
      containerStyle={"gap-2"}
      inputStyle={
        "h-[40px] md:h-[52px] w-[40px] min-w-[40px] md:w-[52px] md:min-w-[52px] outline-none border border-black-1 rounded-[12px] text-[14px] font-normal text-center"
      }
      value={otp}
      onChange={setOtp}
      numInputs={6}
      inputType="tel"
      renderSeparator={false}
      renderInput={(props) => <input {...props} />}
    />
  );
}

export default InputForOtp;
