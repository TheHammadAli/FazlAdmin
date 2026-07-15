import React, { useEffect } from "react";

export const useClickOutside = (
  menuRef: React.RefObject<HTMLDivElement | null>,
  cb: () => void
) => {
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        cb();
      }
    };
    document.addEventListener("mousedown", handleClickOutsideMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideMenu);
    };
  }, [menuRef, cb]);
};
