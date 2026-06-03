"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { isBellNotification } from "@/lib/notification-text";

export interface AppNotification {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  text: string;
  icon: string;
  link: string;
  connectionId?: string | null;
  actor?: {
    id: string;
    name: string;
    avatar?: string | null;
    specialty?: string | null;
  } | null;
}

export function useNotifications(userId: string) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshUnreadCount = useCallback(() => {
    if (!userId) return;
    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count ?? 0))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount, pathname]);

  useEffect(() => {
    if (!userId) return;
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind(
      "new-notification",
      (data: { notification: AppNotification }) => {
        if (!isBellNotification(data.notification.type)) {
          refreshUnreadCount();
          return;
        }
        setNotifications((prev) => [data.notification, ...prev]);
        refreshUnreadCount();
      }
    );

    channel.bind(
      "notifications-read",
      (payload: {
        notificationId: string | "all";
        connectionId?: string;
      }) => {
        const { notificationId, connectionId } = payload;

        if (notificationId === "connection-handled" && connectionId) {
          setNotifications((prev) =>
            prev.filter(
              (n) =>
                !(
                  n.type === "connection_request" &&
                  n.connectionId === connectionId
                )
            )
          );
          refreshUnreadCount();
          return;
        }

        if (notificationId === "all") {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } else {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
        }
        refreshUnreadCount();
      }
    );

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId, refreshUnreadCount]);

  return { unreadCount, notifications, setUnreadCount, setNotifications };
}

