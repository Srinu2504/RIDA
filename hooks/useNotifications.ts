"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId) return;
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.count ?? 0))
      .catch(() => {});

    const channel = pusherClient.subscribe(`user-${userId}`);

    channel.bind(
      "new-notification",
      (data: { notification: AppNotification }) => {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    );

    channel.bind(
      "notifications-read",
      ({ notificationId }: { notificationId: string | "all" }) => {
        if (notificationId === "all") {
          setUnreadCount(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
        }
      }
    );

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  return { unreadCount, notifications, setUnreadCount, setNotifications };
}

