import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useState } from "react";
import Image from "next/image";
import crossIcon from "@/assets/icons/cross-icon.svg";
import deleteIcon from "@/assets/icons/delete-icon.svg";
import DoodleButton from "@/components/Ui/DoodleButton";
import type { parameterTypes } from "./ParametersModal";
export type priceTypes = {
  paymentType?: string;
  price?: string;
};
export type { parameterTypes } from "./ParametersModal";
export type ParametersModalTypes = {
  index?: number | null;
  parameters?: parameterTypes[];
  setParameters?: React.Dispatch<React.SetStateAction<parameterTypes[]>>;
  setIsParameterOpen: (val: boolean) => void;
};

function AddParameterValueModal({
  index,
  parameters,
  setParameters,
  setIsParameterOpen,
}: ParametersModalTypes) {
  const { placeholders, error_messages, info_messages } = useDictionary();
  const [parameter, setParameter] = useState(
    parameters?.[index as number]?.name as string
  );
  const [variants, setVariants] = useState<string[]>(
    (parameters?.[index!]?.variants?.length ?? 0) > 0
      ? parameters![index!].variants
      : [""]
  );
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setParameters?.((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index as number] = {
        name: parameter.trim(),
        variants: variants.filter((v) => v.trim() !== ""),
      };
      return updated;
    });

    setIsParameterOpen(false);
  };
  const handleAddVariant = () => {
    setVariants((prev) => [...prev, ""]);
  };

  const handleDeleteVarient = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleVariantChange = (val: string, i: number) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[i] = val;
      return updated;
    });
  };

  const handleDeleteParameter = () => {
    setParameters?.((prev) => {
      if (!prev) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
    setIsParameterOpen(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="  w-[456px] bg-[white] h-max overflow-scroll hide-scrollbar rounded-[10px]"
    >
      <div className="sticky bg-white top-0  z-50 px-5 py-[16px] flex justify-between items-center border-b-[1px] border-gray-9">
        <h1 className="leading-none text-black-3 text-[16px] font-medium">
          {parameters?.[index as number]?.name}
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
            {placeholders.parameter_name}
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

        {/* parameters mapping */}
        {variants?.map((variant, index) => (
          <div key={index} className="space-y-1 mt-5 w-full">
            <p
              className={`text-[14px] font-normal  text-gray-8
            `}
            >
              {placeholders.parameter_value}
            </p>
            <div className="flex gap-3 border-gray-9 border-b-[1px] pb-1">
              <input
                type="text"
                value={variant}
                onChange={(e) => handleVariantChange(e.target.value, index)}
                className="h-[28px] text-[15px] text-black-1 placeholder:text-black-1 font-normal focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
              />
              <Image
                src={deleteIcon}
                className="w-4 cursor-pointer "
                alt="delete-icon"
                onClick={() => handleDeleteVarient(index)}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-end py-6 gap-2">
          <button
            // disabled={parameter.trim().length === 0}
            onClick={handleAddVariant}
            type="button"
            className="bg-transparent border-[1px] border-green-1 text-green-1 disabled:opacity-50 cursor-pointer  h-[34px] w-max px-4 rounded-[6px] flex items-center justify-center"
          >
            <span className="hidden sm:block">
              {placeholders.add_another_value}
            </span>
            <span className=" sm:hidden">{placeholders.add_value}</span>
          </button>
          <button
            onClick={handleDeleteParameter}
            // disabled={parameter.trim().length === 0}
            type="button"
            className="bg-red-1 disabled:opacity-50 cursor-pointer text-white h-[34px] w-max px-4 rounded-[6px] flex items-center justify-center"
          >
            {placeholders.delete}
          </button>
          <DoodleButton
            disabled={parameter.trim().length === 0}
            type="submit"
            className="bg-green-1 disabled:opacity-50 cursor-pointer text-white h-[34px] w-max px-4 rounded-[6px] flex items-center justify-center"
          >
            {placeholders.confirm}
          </DoodleButton>
        </div>
      </div>
    </form>
  );
}

export default AddParameterValueModal;
