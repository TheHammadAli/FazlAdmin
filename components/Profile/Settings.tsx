"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getCookie, setCookie } from "cookies-next";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { useClickOutside } from "@/custom-hooks/useClickOutside";
import Modal from "../Ui/Modals/Modal";
import chevronIcon from "@/assets/icons/chevron.svg";
import chevronRight from "@/assets/icons/chevron-right-icon.svg";
import { i18n, type Locale } from "@/i18n.config";
import { useDeleteAccountMutation } from "@/store/services/authService";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { getUserId } from "@/utils/getUserId";
import { logout } from "@/store/reducers/authReducer";
import { useAppDispatch } from "@/store/store";

function SettingsDivider() {
  return <div className="bg-gray-12 border-t border-gray-9 h-[27px]" />;
}

type SettingsRowProps = {
  label: string;
  value?: string;
  onClick?: () => void;
};

function SettingsRow({ label, value, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center justify-between px-4 py-4 text-left xl:px-6"
    >
      <span className="text-[15px] font-medium text-black-1">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        {value ? (
          <span className="text-[15px] font-normal text-gray-8">{value}</span>
        ) : null}
        <Image src={chevronRight} alt="" className="shrink-0 rtl:rotate-180" />
      </div>
    </button>
  );
}

type SettingsLanguageRowProps = {
  label: string;
  value: string;
  currentLocale: Locale;
  onSelectLocale: (locale: Locale) => void;
};

function SettingsLanguageRow({
  label,
  value,
  currentLocale,
  onSelectLocale,
}: SettingsLanguageRowProps) {
  const [languagesMenu, setLanguagesMenu] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

  useClickOutside(languageRef, () => {
    setLanguagesMenu(false);
  });

  const localeLabel = (locale: Locale) =>
    locale === "en" ? "English" : "اردو";

  return (
    <div ref={languageRef} className="relative">
      <button
        type="button"
        onClick={() => setLanguagesMenu((open) => !open)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-4 text-left xl:px-6"
      >
        <span className="text-[15px] font-medium text-black-1">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[15px] font-normal text-gray-8">{value}</span>
          <Image src={chevronRight} alt="" className="shrink-0 rtl:rotate-180" />
        </div>
      </button>
      {languagesMenu && (
        <div className="absolute ltr:right-4 rtl:left-4 top-full z-50 min-w-[160px] rounded-lg bg-white p-2 shadow-xl space-y-2">
          {i18n.locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => {
                onSelectLocale(locale);
                setLanguagesMenu(false);
              }}
              className={`block w-full cursor-pointer px-2 py-1 text-left text-[14px] font-normal hover:underline ${currentLocale === locale ? "text-green-1" : "text-black-1"
                }`}
            >
              {localeLabel(locale)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Settings() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pathName = usePathname();
  const { pages, placeholders } = useDictionary();
  const [currentLocale, setCurrentLocale] = useState<Locale>(i18n.defaultLocale);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();
  const ph = (key: keyof typeof placeholders) => placeholders[key];

  useEffect(() => {
    const lang = getCookie("lang")?.toString();
    if (lang === "en" || lang === "ur") {
      setCurrentLocale(lang);
    }
  }, []);

  const languageLabel =
    currentLocale === "ur" ? ph("language_ur") : ph("language_en");

  const switchLocale = (locale: Locale) => {
    if (!pathName || locale === currentLocale) return;
    setCookie("lang", locale);
    setCurrentLocale(locale);
    const segments = pathName.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  };

  const handleChangePassword = () => {
    const locale = currentLocale || i18n.defaultLocale;
    router.push(`/${locale}/change-password`);
  };


  const handleConfirmDeleteAccount = () => {
    deleteAccount({ id: getUserId() ?? "" }).unwrap().then(() => {
      toast.success(ph("account_deleted_successfully"));
      dispatch(logout());
      setIsDeleteModalOpen(false);
      router.push("/");
    }).catch((error) => {
      toast.error(error.data.message);
    });
  };

  return (
    <div className="h-full bg-white">
      <Modal
        editModalRef={deleteModalRef}
        open={isDeleteModalOpen}
        setOpen={setIsDeleteModalOpen}
        centered={true}
      >
        <div className="bg-white rounded-[12px] w-[92vw] max-w-[390px] p-5 shadow-xl hide-scrollbar">
          <h2 className="text-[16px] font-semibold text-black-1">
            {ph("delete_my_account")}
          </h2>
          <p className="text-[14px] text-gray-8 mt-2">
            {ph("are_you_sure_you_want_to_delete_your_account")}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-green-1 text-[14px] font-medium"
            >
              {ph("cancel")}
            </button>
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={handleConfirmDeleteAccount}
              className="h-[40px] cursor-pointer flex-1 rounded-[8px] border border-[#E92440] bg-[#E92440] text-white text-[14px] font-medium disabled:opacity-60"
            >
              {isDeletingAccount ? (
                <BeatLoader color="white" size={8} />
              ) : (
                ph("confirm")
              )}
            </button>
          </div>
        </div>
      </Modal>

      <div className="border-b border-gray-9 flex items-center justify-center px-4">
        <div className="h-[72px] w-full max-w-[522px] flex items-center gap-2 text-[14px]">
          <span className="text-gray-11">{pages.profile}</span>
          <Image src={chevronIcon} alt="" className="ltr:rotate-180" />
          <span className="text-green-2">{ph("settings")}</span>
        </div>
      </div>

      <div className="flex justify-center px-4">
        <div className="w-full max-w-[522px]">
          <SettingsRow
            label={ph("change_password")}
            onClick={handleChangePassword}
          />
          <SettingsDivider />
          <SettingsLanguageRow
            label={ph("language")}
            value={languageLabel}
            currentLocale={currentLocale}
            onSelectLocale={switchLocale}
          />
          <SettingsDivider />
          <SettingsRow
            label={ph("delete_my_account")}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default Settings;
