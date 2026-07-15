import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React from "react";
type TabItem = string | { title: string; key: string };

interface TabsProps {
  tabs: TabItem[];
  activeTab: string | { key: string };
  setActiveTab: (value: string) => void;
  paddingX?: string;
}

function getTabKey(tab: TabItem): string {
  return typeof tab === "string" ? tab : tab.key;
}

function isTabActive(tab: TabItem, activeTab: TabsProps["activeTab"]): boolean {
  const tabKey = getTabKey(tab);
  if (typeof activeTab === "string") return tabKey === activeTab;
  return tabKey === activeTab.key;
}

function Tabs({
  tabs,
  activeTab,
  setActiveTab,
  paddingX = "px-[14px]",
}: TabsProps) {
  const { placeholders } = useDictionary();
  type PlaceholderKey = keyof typeof placeholders;

  return (
    <div className="flex ">
      {tabs?.map((tab) => {

        return (
          <div
            key={getTabKey(tab)}
            onClick={() => setActiveTab(getTabKey(tab))}
            className={`h-[38px] capitalize -mb-[1px] flex items-center ${paddingX} text-[14px] cursor-pointer border-b-[2px] transition-all ${
              isTabActive(tab, activeTab)
                ? "font-medium text-green-1 border-green-1"
                : "font-normal text-gray-8 border-transparent"
            }`}
          >
            {typeof tab === "string"
              ? placeholders[tab as PlaceholderKey]
              : tab.title}
          </div>
        );
      })}
    </div>
  );
}

export default Tabs;
