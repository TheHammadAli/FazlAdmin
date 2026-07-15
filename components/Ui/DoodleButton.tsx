"use client";

import Image from "next/image";
import buttonDoodleImage from "@/assets/images/button-doodle-image.svg";

type DoodleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function DoodleButton({
  children,
  className = "",
  type = "button",
  ...props
}: DoodleButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`relative overflow-hidden ${className}`.trim()}
    >
      <Image
        src={buttonDoodleImage}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full rounded-[inherit] object-cover"
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
