"use client";

import Image from "next/image";
import notificationIcon from "@/assets/icons/notification-green-icon.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";

function UpdatesEmptyState() {
    const { placeholders, pages } = useDictionary();

    return (
        <div className="w-full min-h-screen bg-[#F6F7F8] p-3 sm:p-5 lg:p-7">
            <div className="w-full min-h-[calc(100vh-56px)] rounded-[28px] bg-white px-6 py-8 sm:px-8 sm:py-10">
                <h1 className="text-[40px] leading-none font-semibold text-black-1">
                    {pages.updates}
                </h1>

                <div className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center text-center">
                    <Image
                        src={notificationIcon}
                        alt="notification"
                        width={46}
                        height={46}
                        className="opacity-90"
                    />
                    <h2 className="mt-4 text-[44px] leading-none font-semibold text-black-1">
                        {placeholders.no_notifications_yet}
                    </h2>
                    <p className="mt-2 text-[30px] leading-none font-normal text-gray-8">
                        {placeholders.notifications_empty_subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default UpdatesEmptyState;
