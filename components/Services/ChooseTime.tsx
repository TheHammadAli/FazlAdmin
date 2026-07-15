"use client";

import { useState } from "react";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { ChevronUp, ChevronDown } from "lucide-react";

const hours = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);
const periods = ["AM", "PM"];

function TimeColumn({
  value,
  onIncrement,
  onDecrement,
}: {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Up Arrow */}
      <button
        onClick={onDecrement}
        className="text-[#C7C7C7] hover:text-gray-600  cursor-pointer"
      >
        <ChevronUp size={20} />
      </button>

      {/* Value Box */}
      <div className="border-[1px] border-gray-9 rounded-[8px] py-2 px-[9px] text-[16px] font-medium text-black-1  cursor-pointer">
        {value}
      </div>

      {/* Down Arrow */}
      <button
        onClick={onIncrement}
        className="text-[#C7C7C7] hover:text-gray-600 cursor-pointer"
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
}

export default function TimePicker({
  time,
  setTime,
}: {
  time: { hour: string; minute: string; period: string };
  setTime: React.Dispatch<
    React.SetStateAction<{ hour: string; minute: string; period: string }>
  >;
}) {
  const { placeholders } = useDictionary();

  const handleChange = (
    type: "hour" | "minute" | "period",
    direction: "up" | "down"
  ) => {
    setTime((prev) => {
      if (type === "hour") {
        const index = hours.indexOf(prev.hour);
        const newIndex =
          direction === "up"
            ? (index + 1) % hours.length
            : (index - 1 + hours.length) % hours.length;

        return { ...prev, hour: hours[newIndex] };
      }

      if (type === "minute") {
        const index = minutes.indexOf(prev.minute);
        const newIndex =
          direction === "up"
            ? (index + 1) % minutes.length
            : (index - 1 + minutes.length) % minutes.length;

        return { ...prev, minute: minutes[newIndex] };
      }

      if (type === "period") {
        return {
          ...prev,
          period: prev.period === "AM" ? "PM" : "AM",
        };
      }

      return prev;
    });
  };

  return (
    <div className="h-max border-[1px] border-[#E5E5E5] rounded-[12px] flex-1 flex justify-center p-5">
      <div className="space-y-[14px]">
        <h1 className="text-black-2 font-medium text-[14px]">
          {placeholders.choose_time}
        </h1>
        <div className="flex items-center gap-4">
          {/* Hour */}
          <TimeColumn
            value={time.hour}
            onIncrement={() => handleChange("hour", "up")}
            onDecrement={() => handleChange("hour", "down")}
          />

          {/* Minutes */}
          <TimeColumn
            value={time.minute}
            onIncrement={() => handleChange("minute", "up")}
            onDecrement={() => handleChange("minute", "down")}
          />

          {/* AM / PM */}
          <TimeColumn
            value={time.period}
            onIncrement={() => handleChange("period", "up")}
            onDecrement={() => handleChange("period", "down")}
          />
        </div>
      </div>
    </div>
  );
}
