import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useEffect, useState } from "react";
import crossIcon from "@/assets/icons/cross-icon.svg";
import Image from "next/image";
import ChooseDateModal from "./ChooseDate";
import DoodleButton from "@/components/Ui/DoodleButton";
import { BeatLoader } from "react-spinners";

interface DateTimePickerProps {
  setOpenPciker: React.Dispatch<React.SetStateAction<boolean>>;
  setStep: React.Dispatch<React.SetStateAction<"service" | "request">>;
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
  isLoading?: boolean;
  isOfferingTime?: boolean;
  /** When set (e.g. offer new time flow), runs after validation instead of advancing `setStep`. */
  onConfirm?: (date: Date) => void | Promise<void>;
}

function DateTimePickerModal({
  setOpenPciker,
  setStep,
  date,
  setDate,
  isOfferingTime = false,
  isLoading = false,
  onConfirm,
}: DateTimePickerProps) {
  const { placeholders, error_messages, currentLanguage } = useDictionary();
  const [selectedDate, setSelectedDate] = useState<Date>(date);

  const [timeError, setTimeError] = useState(false);
  // Extract hour and minute for input value
  const hour = selectedDate.getHours().toString().padStart(2, "0");
  const minute = selectedDate.getMinutes().toString().padStart(2, "0");

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [newHour, newMinute] = e.target.value.split(":").map(Number);
    const updatedDate = new Date(selectedDate);
    updatedDate.setHours(newHour);
    updatedDate.setMinutes(newMinute);
    updatedDate.setSeconds(0);
    updatedDate.setMilliseconds(0);
    setSelectedDate(updatedDate);

    if (updatedDate < new Date()) {
      setTimeError(true);
    } else {
      setTimeError(false);
      setSelectedDate(updatedDate);
      setDate?.(updatedDate);
    }
  };

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleNext = async () => {
    if (selectedDate < new Date()) {
      setTimeError(true);
      return;
    }
    setTimeError(false);
    setDate?.(selectedDate);
    if (onConfirm) {
      try {
        await onConfirm(selectedDate);
        setOpenPciker(false);
      } catch {
        // Error surfaced by caller (e.g. toast); keep modal open
      }
      return;
    }
    setStep("request");
    setOpenPciker(false);
  };

  return (
    <div className="bg-white  w-screen lg:w-[630px] max-w-[630px] sm:rounded-[10px]">
      <div className="p-4 flex items-center justify-between border-b-[1px] border-[#E3EDF3]">
        <h1 className="text-[16px] font-semibold text-[#0F172A]">
          {placeholders.choose_date_time}
        </h1>
        <Image
          src={crossIcon}
          alt="cross-icon"
          className="h-3 w-3 cursor-pointer"
          onClick={() => setOpenPciker?.(false)}
        />
      </div>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row  gap-5">
          <div className="border-[1px]  border-[#E5E5E5] rounded-[12px] overflow-hidden  p-5 sm:w-[345px] ">
            <ChooseDateModal dateValue={date!} setDateValue={setDate!} />
          </div>
          <div className="flex-1">
            <input
              type="time"
              lang={currentLanguage === "ur" ? "ur-PK" : "en-US"}
              dir={currentLanguage === "ur" ? "rtl" : "ltr"}
              className="accent-green-1 p-2  border-[1px] border-[#E5E5E5] rounded-[12px] w-full focus:outline-0 text-[#030303] text-[16px] font-medium"
              value={`${hour}:${minute}`}
              onChange={handleTimeChange}
            />

            {timeError && (
              <p className="text-red-500 text-sm mt-2">
                {error_messages.future_time}
              </p>
            )}
          </div>
        </div>

        <DoodleButton
          onClick={handleNext}
          disabled={isLoading}
          className="h-[46px] disabled:opacity-50 disabled:pointer-events-none mt-4 border-green-1 bg-green-1 border-[1px] w-full rounded-xl flex items-center justify-center font-medium text-[16px] text-white hover:text-green-1 hover:bg-white cursor-pointer"
        >
          {isLoading ? <BeatLoader color="white" size={8} /> : <>
            {isOfferingTime ? placeholders.offer_new_time : placeholders.next}
          </>}
        </DoodleButton>
      </div>
    </div>
  );
}

export default DateTimePickerModal;
