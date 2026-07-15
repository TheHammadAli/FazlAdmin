import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useState } from "react";
import Image from "next/image";
import crossIcon from "@/assets/icons/cross-icon.svg";
import DoodleButton from "@/components/Ui/DoodleButton";
import chevron from "@/assets/icons/chev-down-icon.svg";
export type priceTypes = {
  paymentType: string;
  price: string;
};
export type PriceModalTypes = {
  selectedPrice: priceTypes;
  setSelectedPrice: (price: priceTypes) => void;
  setIsPriceOpen: (price: boolean) => void;
  type?: string;
};

function normalizePriceValue(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value);
}

function stripPriceFormatting(value: unknown): string {
  return normalizePriceValue(value).replace(/,/g, "");
}

function formatPriceInput(value: unknown): string {
  const rawValue = stripPriceFormatting(value).replace(/\D/g, "");
  if (!rawValue) return "";
  return Number(rawValue).toLocaleString("en-US");
}

function PriceModal({
  selectedPrice,
  setSelectedPrice,
  setIsPriceOpen,
  type,
}: PriceModalTypes) {
  const { placeholders, error_messages, info_messages } = useDictionary();
  const [price, setPrice] = useState(() => formatPriceInput(selectedPrice.price));
  const [priceError, setPriceError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawPrice = stripPriceFormatting(price);
    if (rawPrice === "") {
      setPriceError(error_messages.price_required);
    } else {
      setSelectedPrice({ ...selectedPrice, price: rawPrice });
      setIsPriceOpen(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="  w-[456px] bg-[white] h-max overflow-scroll hide-scrollbar rounded-[10px]"
    >
      <div className="sticky bg-white top-0  z-50 px-5 py-[16px] flex justify-between items-center border-b-[1px] border-gray-9">
        <h1 className="leading-none text-black-3 text-[16px] font-medium">
          {placeholders.price}
        </h1>
        <Image
          src={crossIcon}
          className="w-3 cursor-pointer"
          alt="cross-icon"
          onClick={() => setIsPriceOpen(false)}
        />
      </div>
      <div className="px-5">
        {type === "service" && (
          <h2 className="text-[14px] font-normal text-gray-8 my-3">
            {info_messages.set_price}
          </h2>
        )}
        {/* fix */}
        {type === "service" && (
          <div className="flex gap-2 items-center">
            <div
              className={`h-[18px] w-[18px] ${
                selectedPrice?.paymentType === "fixed"
                  ? "border-[4px] border-green-1"
                  : "border-[1px] border-gray-9"
              } rounded-full cursor-pointer`}
              onClick={() =>
                setSelectedPrice({ ...selectedPrice, paymentType: "fixed" })
              }
            ></div>
            <div className="text-[15px] text-black-1">
              {placeholders.fix_rate}
            </div>
          </div>
        )}
        {/* hourly */}
        {type === "service" && (
          <div className="flex gap-2 items-center mt-2">
            <div
              className={`h-[18px] w-[18px] ${
                selectedPrice?.paymentType === "hourly"
                  ? "border-[4px] border-green-1"
                  : "border-[1px] border-gray-9"
              } rounded-full cursor-pointer`}
              onClick={() =>
                setSelectedPrice({ ...selectedPrice, paymentType: "hourly" })
              }
            ></div>
            <div className="text-[15px] text-black-1">
              {placeholders.hourly_basis}
            </div>
          </div>
        )}

        <div className="space-y-1 mt-5 w-full">
          <p
            className={`text-[14px] font-normal  ${
              priceError ? "text-red-1" : "text-gray-8"
            }`}
          >
            {placeholders.price}
          </p>
          <div className="relative border-gray-9 border-b-[1px] pb-1">
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPrice(formatPriceInput(e.target.value));
                if (priceError) setPriceError("");
              }}
              placeholder={`${placeholders.Rs}0.00`}
              className="h-[28px] rtl:pl-12 ltr:pr-14 text-[15px] text-black-1 placeholder:text-black-1 font-normal focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none "
            />
            {type === "service" && (
              <p className="absolute top-1/2 rtl:left-0  -translate-y-1/2  ltr:right-0">
                -/
                {
                  placeholders?.[
                    selectedPrice?.paymentType as keyof typeof placeholders
                  ]
                }
              </p>
            )}
          </div>

          {priceError && (
            <p className="text-red-1 text-[14px] font-normal">{priceError}</p>
          )}
        </div>

        <div className="flex justify-end py-6">
          <DoodleButton
            type="submit"
            className="bg-green-1 cursor-pointer text-white h-[34px] w-[112px] rounded-[6px] flex items-center justify-center"
          >
            {placeholders.continue}
          </DoodleButton>
        </div>
      </div>
    </form>
  );
}

export default PriceModal;
