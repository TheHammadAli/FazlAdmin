"use client";
import { useClickOutside } from "@/custom-hooks/useClickOutside";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
type Props = {
  children: React.ReactNode;
  editModalRef: React.RefObject<HTMLDivElement | null>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  open: boolean;
  centered?: boolean;
  disableOutsideClick?: boolean;
};
const Modal = ({
  children,
  editModalRef,
  open,
  setOpen,
  centered,
  disableOutsideClick,
}: Props) => {
  const [mounted, setMounted] = useState(false);

  useClickOutside(editModalRef, () => {
    if (!disableOutsideClick) {
      setOpen(false);
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // useEffect(() => {
  //   if (open === true) {
  //     document.body.style.overflow = "hidden";
  //     return () => {
  //       document.body.style.overflow = "scroll";
  //     };
  //   }
  // }, [open]);

  if (!mounted || !open) {
    return null;
  }

  // Rendered via portal so the overlay always escapes ancestor stacking
  // contexts (e.g. a `position: sticky` sidebar), regardless of where the
  // Modal is triggered from in the tree.
  return createPortal(
    <div className="bg-[#1E1E1E]/40 fixed z-[60] w-screen h-screen top-0  left-0 bg-opacity-50 overflow-auto">
      <div
        ref={editModalRef}
        className={`  ${centered &&
          "absolute max-h-[100vh] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 overflow-auto hide-scrollbar"
          }
          `}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
export default Modal;
