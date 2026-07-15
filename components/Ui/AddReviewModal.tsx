"use client";

import React, { useState } from "react";
import Image from "next/image";
import crossIcon from "@/assets/icons/cross-icon.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { BeatLoader } from "react-spinners";
import DoodleButton from "@/components/Ui/DoodleButton";

const STAR_COUNT = 5;

export type AddReviewModalProps = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Called when the user taps Submit; close the modal yourself on success. */
  onSubmit?: (payload: { rating: number; comment: string }) => void | Promise<void>;
  loading?: boolean;
};

function AddReviewModal({ setOpen, onSubmit, loading }: AddReviewModalProps) {
  const { placeholders } = useDictionary();
  type PlaceholderKey = keyof typeof placeholders;
  const ph = (key: PlaceholderKey) => placeholders[key];

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const displayRating = hoverRating || rating;

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (rating < 1) return;
    try {
      await onSubmit?.({ rating, comment: comment.trim() });
    } catch {
      // Caller handles errors (e.g. toast); keep modal open
    }
  };

  return (
    <div className="bg-white w-screen max-w-[496px]  sm:rounded-[10px] shadow-lg hide-scrollbar">
      <div className="p-4 flex items-center justify-between border-b border-[#E3EDF3]">
        <h2 className="text-[16px] font-semibold text-[#0F172A]">
          {ph("write_a_review")}
        </h2>
        <button
          type="button"
          className="p-1 rounded-md hover:bg-black/5"
          onClick={handleClose}
          aria-label={ph("cancel")}
        >
          <Image src={crossIcon} alt="" className="h-3 w-3 cursor-pointer" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[14px] font-medium text-[#0F172A] mb-2">
            {ph("your_rating")}
          </p>
          <div className="flex items-center ">
            {Array.from({ length: STAR_COUNT }, (_, i) => {
              const value = i + 1;
              const active = value <= displayRating;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} / ${STAR_COUNT}`}
                  aria-pressed={rating >= value}

                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="5 0 22 22"
                    className="h-8 w-9 "
                    aria-hidden
                  >
                    <path
                      fill={active ? "#007781" : "none"}
                      stroke="#007781"
                      strokeWidth={1}
                      strokeLinejoin="round"
                      className={active ? "text-[#007781]" : "text-[#787880]/30"}
                      d="M12 3.09l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 14.9l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 3.09z"
                    />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="text-[14px] font-medium text-[#0F172A] block mb-2"
          >
            {ph("review_comment_label")}
          </label>
          <textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={ph("review_comment_placeholder")}
            className="w-full resize-none min-h-[120px] rounded-[10px] border-[1px] border-[#E3EDF3] p-2 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none  focus:ring-0 "
          />
        </div>
      </div>

      <div className="p-4 pt-0 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end  " >
        <button
          type="button"
          disabled={loading}
          onClick={handleClose}
          className="h-[46px] sm:min-w-[100px] cursor-pointer rounded-[8px] border border-green-1 text-[15px] font-medium text-green-1 hover:bg-green-1/10"
        >
          {ph("cancel")}
        </button>
        <DoodleButton
          type="button"
          disabled={rating < 1 || comment.trim().length === 0 || loading}
          onClick={() => void handleSubmit()}
          className="h-[46px] sm:min-w-[100px] cursor-pointer rounded-[8px] border border-green-1 text-[15px] font-medium text-white bg-green-1 hover:opacity-95 disabled:cursor-not-allowed"
        >
          {loading ? <BeatLoader color="white" size={8} /> : ph("submit")}
        </DoodleButton>
      </div>
    </div>
  );
}

export default AddReviewModal;
