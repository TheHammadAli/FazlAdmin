import React, { useState } from "react";
import Image from "next/image";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import Calendar from "react-calendar";
import chevronIcon from "@/assets/icons/chevron.svg";
import "moment/locale/ur";
function ChooseDateModal({
  dateValue,
  setDateValue,
}: {
  dateValue: Date;
  setDateValue: React.Dispatch<React.SetStateAction<Date>>;
}) {
  const { currentLanguage } = useDictionary();

  return (
    <Calendar
      className={`!border-0   !bg-white !gap-5  space-y-6 w-full ${
        currentLanguage === "ar" ? "rtl-calendar" : ""
      } `}
      locale={currentLanguage === "ur" ? "ur-PK" : "en-US"} // weekdays & months follow locale
      maxDetail="month"
      minDate={new Date()}
      onChange={(date) => {
        if (date instanceof Date) {
          setDateValue(date);
        } else if (Array.isArray(date) && date[0] instanceof Date) {
          setDateValue(date[0]);
        }
      }}
      // tileDisabled={({ date }) => !isAvailable(date)}
      value={dateValue}
      next2Label={null}
      prev2Label={null}
      nextLabel={
        <div className="flex justify-end ">
          <Image
            src={chevronIcon}
            alt="chev_icon"
            className="rotate-180 rtl:rotate-0"
          />
        </div>
      }
      prevLabel={
        <div>
          <Image src={chevronIcon} alt="chev_icon" className="rtl:rotate-180" />
        </div>
      }
      navigationLabel={({ label }) => (
        <span className="text-[14px] font-inter font-medium text-[#030303] ">
          {label}
        </span>
      )}
      minDetail="month"
      formatShortWeekday={
        (locale, date) => date.toLocaleDateString(locale, { weekday: "short" }) // ✅ use actual locale (Arabic when ar)
      }
      formatDay={(_, date) => date.getDate().toString()} // ✅ force English numerals for days only
      showFixedNumberOfWeeks={false}
      tileClassName={({ date, view }) => {
        const titleClass =
          "cursor-pointer rounded-[8px] !h-[32px] !max-h-[32px] !max-w-[43px] !mt-[3px] !w-[38px] !text-[12px] !font-inter !font-normal";

        if (view === "month") {
          if (date.getTime() < new Date().setHours(0, 0, 0, 0)) {
            return `${titleClass} !text-gray-400 !bg-gray-100 cursor-not-allowed`; // 👈 custom disabled style
          }
          if (
            dateValue instanceof Date &&
            date.toDateString() === dateValue.toDateString()
          ) {
            return `${titleClass} !bg-green-1 text-white disabled:!text-white !rounded-[8px] `;
          }

          return `${titleClass} !text-[#4B514F] !text-[12px] !font-light !bg-transparent`;
        }
        return "";
      }}
    />
  );
}

export default ChooseDateModal;
