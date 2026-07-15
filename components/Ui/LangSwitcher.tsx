"use client";
import { usePathname, useRouter } from "next/navigation";
import { i18n } from "@/i18n.config";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getCookie, setCookie } from "cookies-next";
import { useClickOutside } from "@/custom-hooks/useClickOutside";
import langSwitcher from "@/assets/icons/world-icon.svg";
import chevDown from "@/assets/icons/chev-down-icon.svg";
export default function LangSwitcher() {
  const router = useRouter();
  const pathName = usePathname();
  const [languagesMenu, showLanguagesMenu] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string | undefined>(
    undefined
  );
  useClickOutside(languageRef, () => {
    showLanguagesMenu(false);
  });
  const redirectedPathName = (locale: string) => {
    if (!pathName) return "/";
    setCookie("lang", locale);
    const segments = pathName.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  };
  useEffect(() => {
    const lang = getCookie("lang")?.toString();
    if (!lang) {
      setCookie("lang", "en");
      setCurrentLanguage("en");
    } else {
      setCurrentLanguage(lang);
    }
  }, []);
  if (!currentLanguage) return null;

  return (
    <div ref={languageRef} className="cursor-pointer relative ">
      {/* <div
        onClick={() => showLanguagesMenu(!languagesMenu)}
        className="relative px-3.5  py-3 rounded-md font-normal text-gray-1 bg-gray-3 border border-gray-2 rtl:font-[500] text-[14px]  ltr:font-[300] capitalize z-10 flex justify-between items-center cursor-pointer` "
      >
        {currentLanguage === "en" ? "English (US)" : "العربية"}

        <Image
          src={downIcon}
          alt="icon"
          className={`ltr:ml-3 rtl:mr-7 ${languagesMenu && "rotate-180"}`}
        />
      </div> */}
      <div
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => showLanguagesMenu(!languagesMenu)}
      >
        <Image src={langSwitcher} className="  " alt="lang-switcher-icon" />
        <div className="text-[14px] text-black-1 font-normal">
          {" "}
          {currentLanguage === "en" ? "English" : "اردو"}
        </div>
        <Image src={chevDown} className="w-[12px]" alt="chevron-down-icon" />
      </div>
      {languagesMenu && (
        <div
          className={`absolute w-full top-5  rounded-lg bg-white shadow-xl p-2  space-y-2 font-semibold  z-50 }`}
        >
          {i18n.locales.map((locale) => {
            return (
              <div key={locale} className="  ">
                <button
                  key={locale}
                  onClick={() => {
                    redirectedPathName(locale);
                    showLanguagesMenu(false);
                  }}
                  className={`hover:underline font-normal    cursor-pointer text-[14px]   ${
                    currentLanguage === locale ? "text-green-1" : "text-black"
                  }`}
                >
                  {locale === "en" ? "English" : "اردو"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
