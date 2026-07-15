import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useState } from "react";
import Image from "next/image";
import crossImage from "@/assets/icons/cross-icon.svg";
interface Props {
  images: (File | string)[];
  setImages: React.Dispatch<React.SetStateAction<(File | string)[]>>;
  deleteMedia?: string[];
  setDeleteMedia?: React.Dispatch<React.SetStateAction<string[]>>;
  /** Unique id for the file input (avoid duplicate ids when multiple pickers on page). */
  inputId?: string;
}

const MAX_IMAGES = 5;

function ChooseImagesTab({
  images,
  setImages,
  setDeleteMedia,
  inputId = "photo-upload",
}: Props) {
  const { placeholders } = useDictionary();
  const [isDragging, setIsDragging] = useState(false);

  const addImageFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const selectedFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!selectedFiles.length) return;
    setImages((prev) => [...prev, ...selectedFiles].slice(0, MAX_IMAGES));
  };

  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(e.target.files);
    e.target.value = "";
  };
  const removeImage = (index: number) => {
    if (typeof images[index] === "string") {
      setDeleteMedia?.((prev) => [...prev, images[index] as string]);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  return (
    <div>
      <div
        className={`mt-5 flex gap-2 ${inputId === "broadcast-modal-photo-upload" ? "flex-nowrap overflow-auto hide-scrollbar" : "flex-wrap"}`}
      >
        {images?.map((file, index) => (
          <div
            key={index}
            className="relative  h-[126px] min-w-[126px] w-[126px] rounded-[12px] overflow-hidden"
          >
            <Image
              src={typeof file === "string" ? file : URL.createObjectURL(file)}
              alt={`upload-${index}`}
              height={100}
              width={100}
              className="object-cover  h-full w-full"
              unoptimized
            />
            <div
              className="absolute  h-[24px]  rounded-full ltr:right-2 rtl:left-2 top-2 w-[24px] bg-opacity-50 flex items-center justify-center cursor-pointer"
              onClick={() => removeImage(index)}
              data-testid="remove-image"
            >
              <div className="h-full w-full rounded-full flex items-center justify-center relative  overflow-hidden">
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
        ))}
        {images.length < MAX_IMAGES && (
          <div
            className={`h-[126px] min-w-[126px] ${images.length === 0 ? "w-full border-green-1 " : "w-auto border-green-1"} flex items-center justify-center rounded-[12px] border-2 border-dashed transition-colors ${isDragging
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
              addImageFiles(e.dataTransfer.files);
            }}
          >
            <label
              htmlFor={inputId}
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

              {images.length === 0 && (
                <h1 className="font-medium text-green-1 text-[16px]">
                  {placeholders.upload_photos}
                </h1>
              )}
              <input
                id={inputId}
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpdate}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
      <div className="w-full flex mt-4 items-center justify-center text-[14px] font-normal text-green-2">
        {images.length}/{MAX_IMAGES}
      </div>
    </div>
  );
}

export default ChooseImagesTab;
