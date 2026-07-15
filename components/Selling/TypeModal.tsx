import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useState } from "react";
import Image from "next/image";
import crossIcon from "@/assets/icons/cross-icon.svg";
import chevron from "@/assets/icons/chev-down-icon.svg";
import DoodleButton from "@/components/Ui/DoodleButton";

export type typeModal = {
  type: string;
  setType: (type: string) => void;
  setIsTypeOpen: (val: boolean) => void;
};
function TypeModal({ type, setType, setIsTypeOpen }: typeModal) {
  const { placeholders, info_messages } = useDictionary();

  return (
    <div className="  w-[456px] bg-[white] h-max overflow-scroll hide-scrollbar rounded-[10px]">
      <div className="sticky bg-white top-0  z-50 px-5 py-[16px] flex justify-between items-center border-b-[1px] border-gray-9">
        <h1 className="leading-none text-black-3 text-[16px] font-medium">
          {placeholders.type}
        </h1>
        <Image
          src={crossIcon}
          className="w-3 cursor-pointer"
          alt="cross-icon"
          onClick={() => setIsTypeOpen(false)}
        />
      </div>
      <div className="px-5 pb-4">
        <h2 className="text-[14px] font-normal text-gray-8 my-3">
          {placeholders.select_listing}
        </h2>
        {/* fix */}
        <div className="flex gap-2 items-center">
          <div
            className={`h-[18px] w-[18px] ${type === "retail"
              ? "border-[4px] border-green-1"
              : "border-[1px] border-gray-9"
              } rounded-full cursor-pointer`}
            onClick={() => setType("retail")}
          ></div>
          <div className="text-[15px] text-black-1">{placeholders.retail}</div>
        </div>
        {/* hourly */}
        <div className="flex gap-2 items-center mt-2">
          <div
            className={`h-[18px] w-[18px] ${type === "classified"
              ? "border-[4px] border-green-1"
              : "border-[1px] border-gray-9"
              } rounded-full cursor-pointer`}
            onClick={() => setType("classified")}
          ></div>
          <div className="text-[15px] text-black-1">
            {placeholders.classified}
          </div>
        </div>
        <div className="flex justify-end py-2">
          <DoodleButton
            disabled={type === ""}
            // type="submit"
            onClick={() => setIsTypeOpen(false)}
            className="bg-green-1 disabled:opacity-50 cursor-pointer text-white h-[34px] w-max px-4 rounded-[6px] flex items-center justify-center"
          >
            {placeholders.confirm}
          </DoodleButton>
        </div>
      </div>
    </div>
  );
}

export default TypeModal;
