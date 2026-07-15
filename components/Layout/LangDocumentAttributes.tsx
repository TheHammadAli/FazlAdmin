"use client";

import { useEffect } from "react";
import { gulzar } from "@/app/fonts";

export default function LangDocumentAttributes({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.body.className = lang === "ur" ? gulzar.className : "";
  }, [lang]);

  return children;
}
