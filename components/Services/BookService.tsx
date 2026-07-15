"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetServiceDetailQuery } from "@/store/services/sellingService";
import BuyServiceDetail from "./BuyServiceDetail";
import ServiceCart from "./ServiceCart";
import Modal from "../Ui/Modals/Modal";
import DateTimePickerModal from "./DateTimePickerModal";
import ServiceDetailSkeleton from "../Ui/ServiceDetailPageSkelton";
import { useRequireSignIn } from "@/custom-hooks/useRequireSignIn";
import { useDictionary } from "@/dictionaries/DictionaryProvider";

function BookService() {
  const router = useRouter();
  const { error_messages } = useDictionary();
  const { isGuest, requireSignIn } = useRequireSignIn();
  const [step, setStep] = useState<"service" | "request">("service");
  const id = useSearchParams().get("id");
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [openPciker, setOpenPciker] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(new Date());

  const {
    data: service,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetServiceDetailQuery(id, {
    skip: !id,
  });

  const loading = isLoading || isFetching;
  const isServiceNotFound =
    !id ||
    (isError &&
      error &&
      "status" in error &&
      (error.status === 404 ||
        (error.data as { message?: string })?.message === "Service not found"));

  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    if (isGuest && step === "request") {
      router.push("/signin");
      setStep("service");
    }
  }, [isGuest, step, router]);

  const handleSetOpenPicker = (open: boolean) => {
    if (open) {
      requireSignIn(() => setOpenPciker(true));
    } else {
      setOpenPciker(false);
    }
  };

  const handleSetStep = (val: "service" | "request") => {
    if (val === "request") {
      requireSignIn(() => setStep(val));
    } else {
      setStep(val);
    }
  };

  if (isServiceNotFound) {
    return (
      <div className="h-[80vh] flex items-center justify-center w-full text-black-1">
        {error_messages.service_not_found}
      </div>
    );
  }

  return (
    <div>
      <Modal
        editModalRef={modalRef}
        open={openPciker}
        setOpen={handleSetOpenPicker}
        centered={true}
      >
        <DateTimePickerModal
          setOpenPciker={setOpenPciker}
          setStep={handleSetStep}
          date={date}
          setDate={setDate}
        />
      </Modal>
      {step === "service" &&
        (loading ? (
          <ServiceDetailSkeleton />
        ) : (
          <BuyServiceDetail
            setStep={handleSetStep}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
            service={service}
            setOpenPciker={handleSetOpenPicker}
          />
        ))}
      {step === "request" && (
        <ServiceCart service={service} date={date} />
      )}
    </div>
  );
}

export default BookService;
