"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import DoodleButton from "@/components/Ui/DoodleButton";
import chevronIcon from "@/assets/icons/chevron.svg";
import infoCircleIcon from "@/assets/icons/info-circle.svg";
import {
  useGetServicesRequestsQuery,
  useStartJobMutation,
} from "@/store/services/sellingService";
import { getCookie } from "cookies-next";
import { formatRequestedDateTime } from "@/utils/formatRequestedDateTime";
import { toast } from "react-hot-toast";
import { parsePositiveInt } from "../Updates/Notifications";
import JobActionConfirmModal from "./JobActionConfirmModal";
import { BeatLoader } from "react-spinners";
import { getUserId } from "@/utils/getUserId";
type RequestFilterKey = "sent" | "new_offer" | "accepted" | "rejected";

type RequestCard = {
  _id: string;
  title: string;
  customer: { id: string; name: string };
  price: string;
  requestedDateTime: string;
  startedAt?: string;
  status: "pending" | "accepted" | "rejected";
  filter: RequestFilterKey;
  jobStatus: "in_progress" | "completed" | "cancelled" | "not_started";
};

function MyJobs() {
  const limit = 10;
  const [page, setPage] = useState(1);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const prevScrollHeightRef = useRef(0);
  const isLoadingNextPageRef = useRef(false);
  const jobsContainerRef = useRef<HTMLDivElement>(null);
  const { currentLanguage } = useDictionary();
  const { placeholders } = useDictionary();
  type PlaceholderKey = keyof typeof placeholders;
  const userId = getUserId() ?? "";
  const [filteredRequests, setFilteredRequests] = useState<RequestCard[]>([]);
  const [action, setAction] = useState<string>("");
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "start_job" | "complete_job" | null
  >(null);
  const [pendingRequestId, setPendingRequestId] = useState<string>("");
  const {
    data: servicesRequests,
    isLoading,
    isFetching,
  } = useGetServicesRequestsQuery(
    { id: userId, page: page, limit: limit, role: "provider", status: "accepted" },
    { skip: !userId },
  );
  const [startJob, { isLoading: isJobActionLoading }] = useStartJobMutation();
  const [updateReqId, setUpdateReqId] = useState<string>("");
  const totalPages = parsePositiveInt(servicesRequests?.meta?.totalPages);
  const canLoadMore =
    totalPages != null
      ? page < totalPages
      : servicesRequests?.meta?.total >= limit;
  const isInitialLoading =
    (isLoading || isFetching) && page === 1 && filteredRequests.length === 0;
  function handleScrollNearBottom(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (!userId || isFetching || !canLoadMore || isLoadingNextPageRef.current)
      return;
    const nearTop = el.scrollTop <= 80;
    if (!nearTop) return;
    isLoadingNextPageRef.current = true;
    prevScrollHeightRef.current = el.scrollHeight;
    setPage((p) => p + 1);
  }
  const handleJobAction = (id: string, action: string) => {
    setAction(action);
    setUpdateReqId(id);
    startJob({
      requestId: id,
      action: action,
    })
      .unwrap()
      .then((res) => {
        toast.success(res.message);
        setAction("");
        setUpdateReqId("");
      })
      .catch((err) => {
        toast.error(err.data.message);
        setAction("");
        setUpdateReqId("");
      });
  };
  const openActionConfirm = (
    id: string,
    action: "start_job" | "complete_job",
  ) => {
    const serviceInProgress = filteredRequests.find(
      (item) => item.jobStatus === "in_progress",
    );
    if (serviceInProgress && action === "start_job") {
      toast.error(ph("service_already_in_progress"));
      return;
    }
    setPendingRequestId(id);
    setPendingAction(action);
    setOpenConfirmModal(true);
  };
  const handleConfirmAction = () => {
    if (!pendingRequestId || !pendingAction) return;
    handleJobAction(pendingRequestId, pendingAction);
    setOpenConfirmModal(false);
  };

  const formatElapsed = (startedAt?: string) => {
    if (!startedAt) return "00:00";
    const startMs = new Date(startedAt).getTime();
    if (!Number.isFinite(startMs)) return "00:00";
    const diffMs = Math.max(0, nowTs - startMs);
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!servicesRequests) return;
    const acceptedRequests: any = servicesRequests?.data

    if (page === 1) {
      setFilteredRequests(acceptedRequests);
    } else {
      setFilteredRequests((prev) => {
        const seen = new Set(prev.map((item) => item._id));
        const next = [...prev];
        acceptedRequests.forEach((item: RequestCard) => {
          if (!seen.has(item._id)) {
            next.push(item);
          }
        });
        return next;
      });
    }
  }, [servicesRequests, userId, page]);

  useEffect(() => {
    if (page <= 1) return;
    if (isFetching) return;
    const el = jobsContainerRef.current;
    if (!el || prevScrollHeightRef.current <= 0) return;
    const heightDiff = el.scrollHeight - prevScrollHeightRef.current;
    el.scrollTop = el.scrollTop + heightDiff;
    prevScrollHeightRef.current = 0;
    isLoadingNextPageRef.current = false;
  }, [isFetching, page, filteredRequests.length]);

  useEffect(() => {
    if (!isFetching) {
      isLoadingNextPageRef.current = false;
    }
  }, [isFetching]);

  useEffect(() => {
    const hasRunningTimer = filteredRequests.some(
      (item) => item.jobStatus === "in_progress" && !!item.startedAt,
    );
    if (!hasRunningTimer) return;
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [filteredRequests]);

  const ph = (key: PlaceholderKey) => placeholders[key];
  return (
    <div className=" h-screen ">
      <JobActionConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        pendingAction={pendingAction}
        isLoading={isJobActionLoading}
        isActionMatching={
          updateReqId === pendingRequestId && action === pendingAction
        }
        startTimerLabel={ph("start_timer")}
        endServiceLabel={ph("end_service")}
        cancelLabel={ph("cancel")}
        onConfirm={handleConfirmAction}
      />
      <div>
        <div className="border-b px-4  h-[72px] border-gray-9 flex items-center justify-center">
          <div className="h-full    w-[522px]  flex items-center gap-2 text-[14px]">
            <span className="text-gray-11">{ph("profile")}</span>
            <Image src={chevronIcon} alt="chevron" className="ltr:rotate-180" />
            <span className="text-green-2">{ph("my_jobs")}</span>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-[522px] pt-5">
            <div className="flex items-center justify-between border-b-1 border-[#E5E5E5] pb-3 px-4">
              <span className="text-[#4B514F] text-[14px] font-normal">
                {ph("start_timer_when_service_begins")}
              </span>
              <Image src={infoCircleIcon} alt="plus" />
            </div>
            <div
              ref={jobsContainerRef}
              onScroll={handleScrollNearBottom}
              className="mt-4 px-4 max-w-[760px] bg-white overflow-y-auto h-[calc(100dvh-10rem)]"
            >
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse py-4 border-b border-gray-9"
                  >
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
                    <div className="mt-3 flex justify-end">
                      <div className="h-[38px] w-[222px] rounded-[6px] bg-gray-200" />
                    </div>
                  </div>
                ))
              ) : filteredRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] font-normal text-[#4B514F]">
                    {ph("no_jobs_available")}
                  </p>
                </div>
              ) : (
                filteredRequests.map((item: RequestCard, index: number) => {
                  const isExpired =
                    new Date(item.requestedDateTime).getTime() < Date.now();
                  const isExtendingTiming =
                    item.jobStatus === "in_progress" &&
                    new Date(item.requestedDateTime).getTime() < Date.now();
                  return (
                    <div
                      key={index}
                      className="py-4 border-b border-gray-9 rtl:pl-3 ltr:pr-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] text-[#3C9197] font-medium leading-none first-letter:capitalize">
                          {ph("booked_your_service").replace(
                            "{name}",
                            item?.customer?.name ?? "",
                          )}
                        </p>
                        {item.jobStatus === "in_progress" && (
                          <h1 className="text-[26px] font-semibold text-green-1">
                            {formatElapsed(item.startedAt)}
                          </h1>
                        )}{" "}
                      </div>

                      <p className="text-[15px] font-medium mt-2 leading-none text-black-1">
                        {formatRequestedDateTime(
                          item.requestedDateTime,
                          currentLanguage,
                        )}
                      </p>
                      {item.jobStatus === "in_progress" && (
                        <p
                          className={`text-[14px] font-normal mt-2 leading-none 
                          text-[#FF9500]
                            `}
                        >

                          {ph("service_in_progress")}
                        </p>
                      )}
                      {isExpired && item?.jobStatus === "not_started" && (
                        <p
                          className={`text-[14px] font-normal mt-2 leading-none 
                          text-red-1
                            `}
                        >
                          {ph("booking_date_passed")}
                        </p>
                      )}

                      {item.jobStatus === "completed" && (
                        <p className="text-[14px] font-normal text-[#007781] mt-2 leading-none">
                          {ph("service_completed")}
                        </p>
                      )}

                      <div className="flex justify-end ">
                        {item.jobStatus === "in_progress" && (
                          <button
                            onClick={() =>
                              openActionConfirm(item._id, "complete_job")
                            }
                            className="text-[14px] min-h-[38px] font-normal w-[222px] py-[8px] rounded-[6px] cursor-pointer bg-[#E92440] text-white"
                          >
                            {ph("end_service")}
                          </button>
                        )}
                        {item.jobStatus === "not_started" && (
                          <DoodleButton
                            disabled={isExpired}
                            onClick={() =>
                              openActionConfirm(item._id, "start_job")
                            }
                            className="text-[14px] disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] font-normal w-[222px] py-[8px] rounded-[6px] cursor-pointer bg-green-1 text-white"
                          >
                            {ph("start_timer")}
                          </DoodleButton>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isFetching && page > 1 && filteredRequests.length > 0 && (
                <div className="py-4 flex justify-center">
                  <BeatLoader color="#007781" size={6} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyJobs;
