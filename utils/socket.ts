import { io, type Socket } from "socket.io-client";
import { getUserId } from "./getUserId";
import { getToken } from "./getToken";

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BASE_URL!, {
      query: { userId: getUserId() ?? "" },
      auth: { token: getToken() ?? "" },
    });
  }
  return socket;
};

export const getSocket = () => socket;
