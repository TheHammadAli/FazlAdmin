"use client";
import React, { useState } from "react";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import ServiceFeeds from "./ServiceFeeds";
import ProductFeeds from "./ProductFeeds";

function Feed() {
    const tabs = ["products", "services"] as const;
    const [activeTab, setActiveTab] = useState<string>(tabs[0]);
    const { placeholders } = useDictionary();
    type PlaceholderKey = keyof typeof placeholders;
    const tabsComponents: { [key: string]: React.ReactNode } = {
        products: <ProductFeeds />,
        services: <ServiceFeeds />,
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden pt-2 lg:pt-4">
                <div className="absolute left-1/2 top-15 z-50 flex h-[37px] w-[204px] -translate-x-1/2 -translate-y-1/2 items-center gap-[2px] rounded-lg bg-[#E2E8F080]/50 p-[2px]">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`flex h-full w-[50%] cursor-pointer items-center justify-center rounded-lg text-[14px] font-medium capitalize transition-colors ${activeTab === tab
                                ? "bg-white text-[#0F172A]"
                                : "bg-transparent text-white font-normal"
                                }`}
                        >
                            {placeholders[tab as PlaceholderKey]}
                        </button>
                    ))}
                </div>
                {tabsComponents[activeTab]}
            </div>
        </div>
    );
}

export default Feed;