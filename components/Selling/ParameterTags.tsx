"use client";

import Image from "next/image";
import chevron from "@/assets/icons/chev-down-icon.svg";
import plusIcon from "@/assets/icons/green-plus-icon.svg";
import type { parameterTypes } from "./ParametersModal";

type ParameterTagsProps = {
  label: string;
  parameters: parameterTypes[];
  onClick: () => void;
};

export function removeParameterVariant(
  parameters: parameterTypes[],
  paramIndex: number,
  variantIndex: number,
): parameterTypes[] {
  return parameters
    .map((parameter, index) => {
      if (index !== paramIndex) return parameter;
      return {
        ...parameter,
        variants: parameter.variants.filter((_, i) => i !== variantIndex),
      };
    })
    .filter((parameter) => parameter.variants.length > 0);
}

function ParameterTags({ label, parameters, onClick }: ParameterTagsProps) {
  const listedParameters = parameters.filter(
    (parameter) => parameter.name.trim() !== "" || parameter.variants.length > 0,
  );

  if (listedParameters.length === 0) {
    return (
      <div className="border-b border-gray-9">
        <button
          type="button"
          onClick={onClick}
          className="my-4 ml-[15px] flex w-max cursor-pointer items-center gap-2"
        >
          <Image src={plusIcon} alt="" />
          <span className="text-green-1 font-normal text-[15px]">{label}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {listedParameters.map((parameter, index) => (
        <button
          key={`${parameter.name}-${index}`}
          type="button"
          onClick={onClick}
          className="flex w-full h-[50px] cursor-pointer items-center justify-between border-b border-gray-9 bg-white px-4 text-left"
        >
          <h3 className="text-[15px] font-medium text-black-1 shrink-0">
            {parameter.name}
          </h3>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-normal text-gray-8">
              {parameter.variants.join(", ")}
            </span>
            <Image
              src={chevron}
              alt=""
              className="-rotate-90 rtl:rotate-90 w-4 shrink-0"
            />
          </div>
        </button>
      ))}

      <div className="border-b border-gray-9">
        <button
          type="button"
          onClick={onClick}
          className="my-4 ml-[15px] flex w-max cursor-pointer items-center gap-2"
        >
          <Image src={plusIcon} alt="" />
          <span className="text-green-1 font-normal text-[15px]">{label}</span>
        </button>
      </div>
    </>
  );
}

export default ParameterTags;
