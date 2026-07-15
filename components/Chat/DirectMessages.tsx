import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { useDictionary } from '@/dictionaries/DictionaryProvider';
import { useGetAllConversationsForUserQuery } from '@/store/services/chatService';
import { getUserId } from '@/utils/getUserId';
import { initializeSocket } from '@/utils/socket';
import { useEffect } from 'react';
import { baseApi } from '@/store/baseApi';
import Image from 'next/image';
import { type ChatThread } from "./types";
import { ChatSidebarProps } from './ChatSidebar';
import { parsePositiveInt } from '../Updates/Notifications';
import moment from 'moment';
import noMessagesIcon from "@/assets/icons/no-message.svg";
import noImageAvtar from "@/assets/images/profile-placehonder.png";
import AvatarUi from '../Ui/AvatarUi';
function DirectMessages({
    threadType,
    setThreadType,
    chatId,
    onSelectChat,
}: ChatSidebarProps) {

    const { currentLanguage } = useDictionary();
    const dispatch = useDispatch();
    const PAGE_LIMIT = 15;
    const [page, setPage] = useState(1);

    const [isMounted, setIsMounted] = useState(false);
    const { placeholders } = useDictionary();
    type PlaceholderKey = keyof typeof placeholders;
    const ph = (key: PlaceholderKey) => placeholders[key];

    const [filteredThreads, setFilteredThreads] = useState<ChatThread[]>([]);
    const userId = getUserId() ?? "";
    const { data: conversations, isFetching, isLoading } = useGetAllConversationsForUserQuery({
        id: userId,
        page,
        limit: PAGE_LIMIT,
    },
        {
            skip: !userId,
        },
    );

    const totalPages = parsePositiveInt(conversations?.data?.totalPages);
    const lastBatch =
        (conversations?.data?.conversations as ChatThread[] | undefined) ?? [];
    const canLoadMore =
        totalPages != null ? page < totalPages : lastBatch.length >= PAGE_LIMIT;

    function handleScrollNearBottom(e: React.UIEvent<HTMLUListElement>) {
        if (!userId || isFetching || !canLoadMore) return;
        const el = e.currentTarget;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
        if (!nearBottom) return;
        setPage((p) => p + 1);
    }

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const socket = initializeSocket();
        if (!socket) return;
        socket.on("receiveMessage", (data) => {
            dispatch(baseApi.util.invalidateTags(["Chat"]));
        });
    }, [dispatch]);

    useEffect(() => {
        const firstConversation = conversations?.data?.[0] as ChatThread | undefined;
        const matchedConversation = conversations?.data?.find((conversation: ChatThread) => conversation?._id === chatId);
        if (chatId && matchedConversation) {
            onSelectChat(matchedConversation);
        }
        if (!chatId && firstConversation) {
            onSelectChat(firstConversation);
        }
        if (page === 1) {
            setFilteredThreads(conversations?.data ?? []);
        } else {
            setFilteredThreads((prev) => [...prev, ...conversations?.data]);
        }
    }, [chatId, conversations?.data, onSelectChat, page]);

    return (
        <ul onScroll={handleScrollNearBottom} className="h-[calc(100%-104px)] overflow-y-auto">
            {isMounted && isLoading && page === 1
                ? Array.from({ length: 6 }).map((_, index) => (
                    <li key={index} className="px-4 py-4">
                        <div className="flex animate-pulse items-start gap-3">
                            <div className="h-11 w-11 rounded-full bg-gray-200" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="h-4 w-32 rounded bg-gray-200" />
                                    <div className="h-3 w-10 rounded bg-gray-200" />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="h-3 w-44 rounded bg-gray-200" />
                                    <div className="h-2 w-2 rounded-full bg-gray-200" />
                                </div>
                            </div>
                        </div>
                    </li>
                ))
                : filteredThreads.length === 0 ? (
                    <li className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <Image src={noMessagesIcon} alt="no-messages" />
                        <h3 className="mt-1 text-[22px] font-medium  text-black-1">{ph("no_messages_yet")}</h3>
                        <p className="mt-1 max-w-[560px] text-[14px] font-normal  text-gray-8">
                            {ph("messages_appear_here")}
                        </p>
                    </li>
                ) : filteredThreads?.map((thread: any, index) => {
                    const isActive = thread?._id === chatId;
                    const thread_user = thread?.buyer?.id || thread?.buyer?._id !== userId ? thread?.buyer : thread?.seller;
                    return (
                        <li key={index}>
                            <button
                                type="button"
                                onClick={() => {
                                    onSelectChat(thread);
                                }}
                                className={`flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-left ${isActive ? "bg-[#E7F4F5]" : "hover:bg-gray-50"}`}
                            >
                                <AvatarUi
                                    image={thread_user?.image ?? noImageAvtar.src}
                                    name={thread_user?.name ?? ""}
                                    className={`h-11 w-11 rounded-full bg-[#e7f4f5] !text-green-1 ${isActive ? "border-[1px] border-green-1" : ""}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-[15px] font-medium text-[#030303] first-letter:capitalize">{thread_user?.name ?? ""}</p>
                                        <span className="shrink-0 text-[13px] font-normal text-[#4B514F]">{moment(thread.createdAt).locale(currentLanguage).fromNow()}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <p className="truncate text-sm text-gray-600">{thread.latestMessage?.text ?? ""}</p>
                                        {thread.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#3C9197]" /> : null}
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
        </ul>
    )
}

export default DirectMessages