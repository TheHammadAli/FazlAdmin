"use client";

import { type ChatThread } from "./types";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import DirectMessages from "./DirectMessages";
import { useRef, useState } from "react";
import BroadCatMessages from "./BroadCatMessages";
import addBroadCast from "@/assets/icons/add-broadcast.svg";
import Image from "next/image";
import BroadCastModal from "../Ui/BroadCastModal";
import Modal from "../Ui/Modals/Modal";
export type ChatSidebarProps = {
  onSelectChat: (thread: ChatThread) => void;
  threadType: string;
  setThreadType: (threadType: string) => void;
  chatId: string;
  broadcast?: { _id?: string; id?: string } | null;
};

export default function ChatSidebar({
  threadType,
  setThreadType,
  chatId,
  onSelectChat,
}: ChatSidebarProps) {
  const { placeholders } = useDictionary();
  const [openBroadcast, setOpenBroadcast] = useState(false);
  const broadcastRef = useRef<HTMLDivElement>(null); type PlaceholderKey = keyof typeof placeholders;
  const ph = (key: PlaceholderKey) => placeholders[key];
  const tabs = {
    direct_messages: <DirectMessages threadType={threadType} setThreadType={setThreadType} chatId={chatId} onSelectChat={onSelectChat} />,
    broadcast_messages: <BroadCatMessages chatId={chatId} onSelectChat={onSelectChat} />,
  }
  return (
    <aside className="h-full w-full border-r border-gray-200 bg-white lg:w-[320px]" >
      <div className="flex justify-between h-16 items-center border-b border-gray-200 px-4">
        <h1 className="text-[22px] font-medium text-[#030303]">{ph("chat_title")}</h1>
        {threadType === "broadcast_messages" && <Image onClick={() => setOpenBroadcast(true)} src={addBroadCast} alt="add-broadcast" className="w-7 h-7 cursor-pointer" />
        }
      </div>
      <div className="flex text-sm">
        <button type="button" onClick={() => setThreadType("direct_messages")} className={`w-1/2 cursor-pointer py-2.5 ${threadType === "direct_messages" ? "border-b-2 border-[#3C9197] font-medium text-[#007781]" : "border-b border-[#E5E5E5] font-normal text-[#4B514F]"}`}>
          {ph("direct_messages")}
        </button>
        <button type="button" onClick={() => setThreadType("broadcast_messages")} className={`w-1/2 cursor-pointer py-2.5 ${threadType === "broadcast_messages" ? "border-b-2 border-[#3C9197] font-medium text-[#007781]" : "border-b border-[#E5E5E5] font-normal text-[#4B514F]"}`}>
          {ph("broadcast_messages")}
        </button>
      </div>
      {tabs[threadType as keyof typeof tabs]}
      <Modal
        editModalRef={broadcastRef}
        open={openBroadcast}
        setOpen={setOpenBroadcast}
        centered={false}
      >
        <div className=" h-full w-full flex justify-center  pt-12 ">
          <BroadCastModal setOpenBroadcast={setOpenBroadcast} />
        </div>
      </Modal>
    </aside >
  );
}
