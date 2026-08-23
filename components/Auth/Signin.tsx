"use client";
import React, { useState } from "react";
import { BeatLoader } from "react-spinners";
import AuthImagePanel from "./AuthImagePanel";
import { useAppDispatch } from "@/store/store";
import { useRouter } from "next/navigation";
import { useSigninMutation } from "@/store/services/authService";
import toast from "react-hot-toast";
import {
  setProfileCompleted,
  setToken,
  setUserId,
  logout,
} from "@/store/reducers/authReducer";
import { baseApi } from "@/store/baseApi";
import DoodleButton from "@/components/Ui/DoodleButton";
import Footer from "./Footer";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { setAdminRoleCookie } from "@/utils/authCookies";

export type Body = {
  email?: string;
  password?: string;
};

const SIGNIN_ERROR_TOAST_ID = "signin-error";
const SIGNIN_ERROR_TOAST_DURATION_MS = 1000;

function getSigninErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (!err || typeof err !== "object") return fallback;

  if ("data" in err && err.data && typeof err.data === "object") {
    const data = err.data as { message?: string };
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  if ("message" in err && typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }

  return fallback;
}

function Signin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error_messages } = useDictionary();

  const [emailError, setEmailError] = useState("");
  const [email, setEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [signin, { isLoading }] = useSigninMutation();

  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let isValid = true;

    if (!email.trim()) {
      setEmailError("Email is required*");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password.trim()) {
      setPasswordError("Password is required*");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!isValid) return;

    try {
      toast.dismiss(SIGNIN_ERROR_TOAST_ID);
      const body: Body = { email, password };

      const res = await signin(body).unwrap();



      // Clear cached data from any previous session before storing the new user.
      dispatch(baseApi.util.resetApiState());

      // ✅ Store tokens
      dispatch(
        setToken({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        })
      );

      // ✅ Store user
      localStorage.setItem("user", JSON.stringify({ user: res.data.user }));

      dispatch(setUserId(res.data.user.id));

      const ADMIN_PANEL_ROLES = ["admin", "super_admin", "moderator"];
      const roles = res?.data?.user?.roles ?? res?.data?.roles;
      const isAdmin =
        Array.isArray(roles) &&
        roles.some((role) =>
          ADMIN_PANEL_ROLES.includes(
            String(typeof role === "string" ? role : role?.name).toLowerCase(),
          ),
        );
      setAdminRoleCookie(isAdmin);

      if (!isAdmin) {
        dispatch(logout());
        toast.error("Access denied. Admin account required.", {
          id: SIGNIN_ERROR_TOAST_ID,
          duration: SIGNIN_ERROR_TOAST_DURATION_MS,
        });
        return;
      }

      if (!res?.data?.user?.phone) {
        dispatch(setProfileCompleted(false));
        router.replace("/complete-info");
      } else {
        dispatch(setProfileCompleted(true));
        router.replace("/admin");
      }
      // Router Cache can hold a pre-login RSC payload for the target route (fetched before the
      // auth cookies existed) — refresh forces Next to treat it as stale and re-fetch fresh,
      // which is otherwise only what a manual browser reload was doing.
      router.refresh();
    } catch (err) {
      const message = getSigninErrorMessage(
        err,
        error_messages.something_went_wrong,
      );

      toast.error(message, {
        id: SIGNIN_ERROR_TOAST_ID,
        duration: SIGNIN_ERROR_TOAST_DURATION_MS,
      });
    }
  };

  return (
    <div className="flex h-dvh w-full max-w-full overflow-hidden">
      {/* Left section */}
      <AuthImagePanel />

      {/* Right section */}
      <form
        onSubmit={handleSignin}
        className="flex h-full w-full min-w-0 flex-col items-center justify-between px-5 pt-[80px] pb-8 sm:px-[50px] lg:w-1/2 xl:px-[150px]"
      >
        <div className="w-full max-w-[500px]">
          <h1 className="text-black-1 font-medium text-[22px] text-center">
            Sign in
          </h1>
          <p className="font-light text-[14px] text-center text-gray-8">
            Sign in to your account
          </p>

          {/* Email */}
          <div className="space-y-2 mt-5">
            <p
              className={`text-[14px] ${emailError ? "text-red-1" : "text-gray-8"
                }`}
            >
              Email
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-[28px] w-full border-b ${emailError ? "border-red-1" : "border-gray-9"
                } focus:outline-none`}
            />
            {emailError && (
              <p className="text-red-1 text-[14px]">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2 mt-5">
            <p
              className={`text-[14px] ${passwordError ? "text-red-1" : "text-gray-8"
                }`}
            >
              Password
            </p>
            <div
              className={`flex items-center border-b ${passwordError ? "border-red-1" : "border-gray-9"
                }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[28px] w-full focus:outline-none"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer underline"
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>
            {passwordError && (
              <p className="text-red-1 text-[14px]">{passwordError}</p>
            )}
          </div>

          <div className="flex justify-end pt-4 text-[14px] text-green-1">
            <p
              className="cursor-pointer hover:underline"
              onClick={() => router.push("/forget-password")}
            >
              Forgot password?
            </p>
          </div>

          <DoodleButton
            type="submit"
            className="mt-6 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-green-1 text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? <BeatLoader color="white" size={8} /> : "Continue"}
          </DoodleButton>
        </div>
        <div className="shrink-0">
          <Footer showLinks={false} />
        </div>
      </form>
    </div>
  );
}

export default Signin;
