"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import GuestBanner from "./GuestBanner";
import { useGetUnreadNotificationsCountQuery } from "@/store/services/notificationService";
import { getUserId } from "@/utils/getUserId";
import { useAppDispatch } from "@/store/store";
import { baseApi } from "@/store/baseApi";
import { initializeSocket } from "@/utils/socket";
import { useUnreadMessagesCountQuery } from "@/store/services/chatService";
import { playNotificationSound } from "@/utils/playNotificationSound";

function getSocketSenderId(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const payload = data as Record<string, unknown>;
  if (payload.senderId != null) return String(payload.senderId);
  if (typeof payload.sender === "string") return payload.sender;
  if (payload.sender && typeof payload.sender === "object") {
    const sender = payload.sender as { id?: string; _id?: string };
    return sender.id ?? sender._id;
  }
  return undefined;
}

function isFromCurrentUser(data: unknown, currentUserId?: string | null): boolean {
  if (!currentUserId) return false;
  const senderId = getSocketSenderId(data);
  return senderId != null && senderId === String(currentUserId);
}

function Layout({ children }: { children: React.ReactNode }) {
  const [openSidebar, setOpenSidebar] = useState(false);
  const userId = getUserId();
  const [readCount, setReadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { data: unreadNotificationsCount } = useGetUnreadNotificationsCountQuery(userId, { skip: !userId });
  const { data: unreadMessagesCount } = useUnreadMessagesCountQuery({ userId: userId ?? "" }, { skip: !userId });
  const dispatch = useAppDispatch();
  useEffect(() => {
    setReadCount(unreadNotificationsCount?.data?.count || 0);
  }, [unreadNotificationsCount?.data?.count]);
  useEffect(() => {
    const totalUnread =
      unreadMessagesCount?.data?.reduce(
        (sum: number, item: { unreadCount?: number }) => sum + (item.unreadCount ?? 0),
        0,
      ) ?? 0;
    setUnreadMessages(totalUnread);
  }, [unreadMessagesCount?.data]);

  useEffect(() => {
    const socket = initializeSocket();
    if (!socket) return;
    socket.on("notification", (data) => {
      if(data?.type === "SERVICE_REQUEST"){
      playNotificationSound(data?.type);}
      else{
        playNotificationSound("REST");
      }
      dispatch(baseApi.util.invalidateTags(["NOTIFICATIONS"]));
    });
    socket.on("receiveMessage", (data) => {
      if (!isFromCurrentUser(data, userId)) {
        playNotificationSound("REST");
      }
      dispatch(baseApi.util.invalidateTags(["Chat"]));
    });
    socket.on("receiveBroadcastMessage", (data) => {
      if (!isFromCurrentUser(data, userId)) {
        playNotificationSound("SERVICE_REQUEST");
      }
      dispatch(baseApi.util.invalidateTags(["BROADCAST"]));
    });
  }, [dispatch, userId]);

  return (
    <div className="lg:flex">
      
      <MobileHeader unreadMessages={unreadMessages} unreadCount={readCount} openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <Sidebar unreadMessages={unreadMessages} unreadCount={readCount} setUnreadMessages={setUnreadMessages} setReadCount={setReadCount} openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
      <div className="flex min-h-0 w-full flex-col lg:h-screen lg:overflow-y-auto">
       {children}
      </div>
    </div>
  );
}

export default Layout;
