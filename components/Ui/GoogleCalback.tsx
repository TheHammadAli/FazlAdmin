"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import tickIcon from "@/assets/icons/tick-circle.svg";
import Image from "next/image";
import { useGetUserWithProvidedTokenQuery } from "@/store/services/authService";
import { useAppDispatch } from "@/store/store";
import {
  setProfileCompleted,
  setToken,
  setUserId,
} from "@/store/reducers/authReducer";
import { baseApi } from "@/store/baseApi";
import { useLazyGetUserDetailQuery } from "@/store/services/profileService";

export default function GoogleCallback() {
  const searchParams = useSearchParams();

  const router = useRouter();

  const dispatch = useAppDispatch();
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");

  const {
    data: user,
    isLoading,
    isFetching,
    isSuccess,
    isError,
  } = useGetUserWithProvidedTokenQuery({ token });

  const loading = isFetching || isLoading;

  const [
    getUserDetail,
    {
      data: detail,
      isLoading: detailLoading,
      isSuccess: detailSuccess,
      isError: detailError,
    },
  ] = useLazyGetUserDetailQuery();

  const loadingDetail = detailLoading;

  useEffect(() => {
    if (isSuccess) {
      dispatch(baseApi.util.resetApiState());
      dispatch(
        setToken({
          accessToken: token ?? "",
          ...(refreshToken ? { refreshToken } : {}),
        }),
      );
      dispatch(setUserId(user?.data?.sub));
      getUserDetail(user?.data?.sub);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (detailSuccess && detail?.data) {
      if (!detail.data.phone) {
        dispatch(setProfileCompleted(false));
        router.push("/complete-info");
      } else {
        dispatch(setProfileCompleted(true));
        router.push("/welcome");
      }
    }
  }, [detailSuccess, detail, dispatch, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-2xl p-8 flex flex-col items-center w-96">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-1 border-t-transparent"></div>
            <p className="mt-4 text-gray-8 text-center">
              Signing you in with Google...
            </p>
          </>
        )}

        {isSuccess && (
          <>
            <div className="flex items-center justify-center h-12 w-12 bg-green-4 rounded-full">
              <Image src={tickIcon} alt="tick-icon" />
            </div>
            <p className="mt-4 text-green-1 font-medium text-center">
              Login successful! Redirecting...
            </p>
          </>
        )}

        {(isError || detailError) && (
          <>
            <div className="flex items-center justify-center h-12 w-12 bg-red-100 rounded-full">
              ❌
            </div>
            <p className="mt-4 text-red-600 font-medium text-center">
              Something went wrong. Please try again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
