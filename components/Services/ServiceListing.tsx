"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Tabs from "../Ui/Tabs";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import OfferedServices from "./OfferedServices";
import BookedServices from "./BookedServices";
import { useGetUserServiceQuery } from "@/store/services/sellingService";
import { getUserId } from "@/utils/getUserId";
import createManageServiceImage from "@/assets/images/create_manage_service.svg";
import DoodleButton from "@/components/Ui/DoodleButton";

function ServiceListing() {
    const { placeholders } = useDictionary();
    const router = useRouter();
    const userId = getUserId();
    const { data: service, isLoading: isServiceLoading } = useGetUserServiceQuery(
        userId,
        { skip: !userId },
    );
    const hasService = (service?.data?.length ?? 0) > 0;
    const showEmptyBanner =
        Boolean(userId) && !isServiceLoading && service != null && !hasService;

    const tabs = ["offered_service", "booked_services"];
    const [activeTab, setActiveTab] = useState<string>("offered_service");
    const tabsComponents: { [key: string]: React.ReactNode } = {
        offered_service: <OfferedServices />,
        booked_services: <BookedServices />,
    };

    return (
        <div>
            {showEmptyBanner ? (
                <div className=" w-full  sm:sm:mt-4 min-w-0 shrink-0 overflow-hidden  bg-[#F5F9F8] ">
                    <div className="flex  items-center gap-4 px-[18px] sm:px-5 py-[10px] sm:py-5 flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div className="min-w-0 w-full flex-1 ">
                            <h2 className="text-[14px] sm:text-[20px] font-medium leading-tight text-black-1 ">
                                {placeholders.services_listing}
                            </h2>
                            <p className="mt-1 text-[11px] sm:text-[14px] font-normal leading-snug text-[#4B514F]">
                                {placeholders.create_and_manage_services}
                            </p>
                            <DoodleButton
                                type="button"
                                onClick={() =>
                                    router.push("/services/my-service")
                                }
                                className="h-[36px] mt-2 sm:mt-2 sm:h-[42px] w-[200px] sm:max-w-[250px] cursor-pointer rounded-[6px] bg-green-1 text-[14px] font-medium text-white"
                            >
                                {placeholders.create_service}
                            </DoodleButton>

                        </div>
                        <div className="relative h-[64px] sm:h-[100px] w-[100px] sm:w-full max-w-[150px] shrink-0">
                            <Image
                                src={createManageServiceImage}
                                alt=""
                                fill
                                unoptimized
                                className="object-contain object-center sm:object-end"
                                priority
                            />
                        </div>
                    </div>
                </div>
            ) : null}

            <div className={`flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden p-3 ${showEmptyBanner ? 'sm:p-0 mt-4' : 'sm:p-4 lg:p-6'}`}>


                <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 border-b border-gray-9 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:pb-0">
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>

                <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                    {tabsComponents[activeTab]}
                </div>
            </div>
        </div>

    );
}

export default ServiceListing;
