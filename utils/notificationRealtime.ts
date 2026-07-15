import { getSocket } from "./socket";

/** Server Socket.IO event (must match backend). */
export const NOTIFICATION_SOCKET_EVENT = "notification" as const;

/** Dispatched on `window` before RTK invalidates so the list can reset to page 1. */
export const NEW_NOTIFICATION_WINDOW_EVENT = "app:new-notification" as const;

/** Disconnects the shared client from `socket.ts` (listeners + disconnect). */
export function teardownNotificationSocket() {
  const s = getSocket();
  if (!s) return;
  s.removeAllListeners();
  s.disconnect();
}
