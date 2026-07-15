"use client";

import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useState } from "react";
import Image from "next/image";
import crossImage from "@/assets/icons/cross-icon.svg";
interface Props {
  video: File | null | string;
  setVideo: React.Dispatch<React.SetStateAction<File | null | string>>;
}
function ChooseVideoTab({ video, setVideo }: Props) {
  const { placeholders } = useDictionary();
  const [isDragging, setIsDragging] = useState(false);

  const addVideoFile = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const file = Array.from(fileList).find((f) => f.type.startsWith("video/"));
    if (!file) return;
    setVideo(file);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    addVideoFile(e.target.files);
    e.target.value = "";
  };

  const removeVideo = () => {
    setVideo(null);
  };
  return (
    <div>
      <div className="mt-5 flex gap-2 flex-wrap">
        {/* Video Preview */}
        {video && (
          <div className="relative h-[126px] w-[126px] rounded-[12px] overflow-hidden">
            <video
              src={
                typeof video === "string"
                  ? `${video}?t=${Date.now()}`
                  : URL.createObjectURL(video)
              }
              className="object-cover h-full w-full"
              controls
            />
            <div
              className="absolute h-[24px] w-[24px] right-2 top-2 bg-opacity-50 flex items-center justify-center cursor-pointer"
              onClick={removeVideo}
              data-testid="remove-video"
            >
              <div className="h-full w-full rounded-full flex items-center justify-center relative overflow-hidden">
                <div className="h-full w-full absolute bg-white opacity-80 overflow-hidden"></div>
                <div className="relative">
                  <Image
                    src={crossImage}
                    alt="cross-icon"
                    className="overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {!video && (
          <div
            className={`h-[126px] min-w-[126px] ${!video ? "w-full border-green-1 " : "w-auto"} flex items-center justify-center rounded-[12px] border-2 border-dashed transition-colors ${isDragging
              && "border-green-1 bg-green-3/40"
              }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              addVideoFile(e.dataTransfer.files);
            }}
          >
            <label
              htmlFor="video-upload"
              className="h-[46px] border-green-1 border-[1px] px-3 rounded-[12px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="#007781"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>

              <h1 className="font-medium text-green-1 text-[16px]">
                {placeholders.upload_video}
              </h1>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="w-full flex mt-4 items-center justify-center text-[14px] font-normal text-green-2">
        {video ? "1/1" : "0/1"}
      </div>
    </div>
  );
}

export default React.memo(ChooseVideoTab);
