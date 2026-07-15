"use client";

import Image from "next/image";
import MobileTabsImage from "@/assets/icons/mobile-tabs.svg";
import GoogleStoreBadge from "@/assets/icons/google-store.svg";
import AppleStoreBadge from "@/assets/icons/apple-store.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";

function DownloadAppBanner() {
    const { info_messages } = useDictionary();

    return (
        <section className="mt-8 overflow-hidden rounded-[16px] bg-green-1 sm:mt-14 sm:rounded-[24px]">
            <div className="flex flex-col items-center gap-5 px-5 pb-5 pt-5 sm:flex-row md:gap-8 md:px-10 md:pb-0 xl:gap-16 xl:px-16 2xl:gap-20 2xl:px-20">
                <div className="relative h-[150px] w-full max-w-[280px] shrink-0 sm:h-[190px] sm:max-w-[320px] md:h-[220px] md:max-w-[300px] lg:h-[240px] xl:max-w-[405px] 2xl:h-[500px] 2xl:max-w-[700px]">
                    <Image
                        src={MobileTabsImage}
                        alt=""
                        fill
                        unoptimized
                        sizes="(min-width: 1536px) 700px, 405px"
                        className="object-contain object-center"
                    />
                </div>

                <div className="flex min-w-0 w-full  flex-col text-center sm:max-w-[52%] sm:text-left rtl:sm:text-right 2xl:max-w-none 2xl:flex 2xl:flex-row 2xl:gap-14">
                   <div>
                    <h2 className="text-[18px] font-medium leading-tight text-white sm:text-[20px] md:text-[24px] xl:text-[26px] 2xl:text-[30px]">
                        {info_messages.buy_sell_connect_on_the_go}
                    </h2>
                    <p className="mt-2 text-[18px] font-medium text-white sm:text-[20px] md:text-[22px] xl:text-[26px] 2xl:text-[28px]">
                        {info_messages.download_our_app_now}
                    </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start rtl:sm:justify-end 2xl:gap-4">
                        <a
                            href="#"
                            aria-label={info_messages.download_on_google_play}
                            className="inline-flex shrink-0 transition-opacity hover:opacity-90"
                        >
                            <Image
                                src={GoogleStoreBadge}
                                alt={info_messages.download_on_google_play}
                                width={910}
                                height={270}
                                unoptimized
                                className="h-[42px] w-[140px] lg:h-[54px] xl:w-[182px] 2xl:h-[58px] 2xl:w-[196px]"
                            />
                        </a>
                        <a
                            href="#"
                            aria-label={info_messages.download_on_app_store}
                            className="inline-flex shrink-0 transition-opacity hover:opacity-90"
                        >
                            <Image
                                src={AppleStoreBadge}
                                alt={info_messages.download_on_app_store}
                                width={910}
                                height={270}
                                unoptimized
                                className="h-[54px] w-[140px] xl:w-[182px] 2xl:h-[58px] 2xl:w-[196px]"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default DownloadAppBanner;
