import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useState } from "react";
import Image from "next/image";
import crossIcon from "@/assets/icons/cross-icon.svg";
import DoodleButton from "@/components/Ui/DoodleButton";
import type { parameterTypes } from "./ParametersModal";
export type { parameterTypes } from "./ParametersModal";
export type priceTypes = {
  paymentType?: string;
  price?: string;
};
export type ParametersModalTypes = {
  index?: number | null;
  parameters?: parameterTypes[];
  setParameters?: React.Dispatch<React.SetStateAction<parameterTypes[]>>;
  setIsParameterOpen: (val: boolean) => void;
};

function AddParameterModal({
  parameters,
  setParameters,
  setIsParameterOpen,
}: ParametersModalTypes) {
  const { placeholders, error_messages, info_messages } = useDictionary();
  const [parameter, setParameter] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parameter.trim()) return;
    setParameters?.((prev) => [
      ...(prev || []),
      { name: parameter.trim(), variants: [] },
    ]);
    setParameter("");
    setIsParameterOpen(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="  w-[456px] bg-[white] h-max overflow-scroll hide-scrollbar rounded-[10px]"
    >
      <div className="sticky bg-white top-0  z-50 px-5 py-[16px] flex justify-between items-center border-b-[1px] border-gray-9">
        <h1 className="leading-none text-black-3 text-[16px] font-medium">
          {placeholders.add_parameter}
        </h1>
        <Image
          src={crossIcon}
          className="w-3 cursor-pointer"
          alt="cross-icon"
          onClick={() => setIsParameterOpen(false)}
        />
      </div>
      <div className="px-5">
        <div className="space-y-1 mt-5 w-full">
          <p
            className={`text-[14px] font-normal  text-gray-8
            `}
          >
            {placeholders.name}
          </p>
          <div className="relative border-gray-9 border-b-[1px] pb-1">
            <input
              type="text"
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
              className="h-[28px] text-[15px] text-black-1 placeholder:text-black-1 font-normal focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
            />
          </div>
        </div>

        <div className="flex justify-end py-6">
          <DoodleButton
            disabled={parameter.trim().length === 0}
            type="submit"
            className="bg-green-1 disabled:opacity-50 cursor-pointer text-white h-[34px] w-[112px] rounded-[6px] flex items-center justify-center"
          >
            {placeholders.confirm}
          </DoodleButton>
        </div>
      </div>
    </form>
  );
}

export default AddParameterModal;
