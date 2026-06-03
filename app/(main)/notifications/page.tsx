"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { PageBackHeader } from "@/components/shared/page-back-header";
import { NotificationItem } from "@/components/notifications/notification-item";
import { type AppNotification, useNotifications } from "@/hooks/useNotifications";

type Filter = "all" | "unread" | "likes" | "comments" | "connections" | "messages";

function isMatch(filter: Filter, n: AppNotification) {
  if (filter === "all") return true;
  if (filter === "unread") return !n.isRead;
  if (filter === "likes") return n.type === "like";
  if (filter === "comments") return n.type === "comment" || n.type === "reply";
  if (filter === "connections")
    return n.type === "connection_request" || n.type === "connection_accepted";
  if (filter === "messages") return n.type === "message";
  return true;
}

export default function NotificationsPage() {
  const [userId, setUserId] = useState("");
  const { notifications, setNotifications, setUnreadCount } = useNotifications(userId);
  const [allItems, setAllItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setUserId(d.user?.id ?? ""))
      .catch(() => {});
  }, []);

  const load = useCallback(async (nextPage: number, append = false) => {
    const res = await fetch(`/api/notifications?page=${nextPage}&limit=20`);
    const json = await res.json();
    if (!res.ok) return;
    const incoming = json.notifications as AppNotification[];
    setAllItems((prev) => (append ? [...prev, ...incoming] : incoming));
    setNotifications((prev) =>
      append ? [...prev, ...incoming.slice(0, Math.max(0, 5 - prev.length))] : incoming.slice(0, 5)
    );
    setUnreadCount(json.unreadCount ?? 0);
    setHasMore(Boolean(json.hasMore));
    setPage(nextPage);
  }, [setNotifications, setUnreadCount]);

  useEffect(() => {
    load(1).catch(() => {});
  }, [load]);

  const filtered = useMemo(
    () => allItems.filter((n) => isMatch(filter, n)),
    [allItems, filter]
  );

  return (
    <div className="mx-auto max-w-[840px] px-4 py-5 md:px-6">
      <PageBackHeader
        title="Notifications"
        subtitle="Real-time updates"
        rightAction={
          <button
            type="button"
            className="text-xs font-semibold text-green-primary hover:underline"
            onClick={async () => {
              await fetch("/api/notifications/read", { method: "POST" });
              setAllItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
              setUnreadCount(0);
            }}
          >
            Mark all read
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["unread", "Unread"],
          ["likes", "Likes"],
          ["comments", "Comments"],
          ["connections", "Connections"],
          ["messages", "Messages"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id as Filter)}
            className={`rounded-[999px] px-3 py-1 text-xs font-semibold ${
              filter === id
                ? "bg-[#2d6a4f] text-white"
                : "border border-[#e5ddd0] bg-[#faf6ef] text-text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rida-card flex flex-col items-center gap-2 py-12">
          <Bell className="text-text-muted" size={20} />
          <p className="text-xs text-text-muted">No notifications yet</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`w-full rounded-xl border border-[#e5ddd0] px-3 py-3 ${
              n.isRead
                ? "bg-[#faf6ef]"
                : "border-l-4 border-l-[#2d6a4f] bg-[#f0f7f4]"
            }`}
          >
            <NotificationItem
              notification={n}
              onMarkedRead={(id) => {
                setAllItems((prev) => {
                  const target = prev.find((x) => x.id === id);
                  if (target && !target.isRead) {
                    setUnreadCount((c) => Math.max(0, c - 1));
                  }
                  return prev.map((x) =>
                    x.id === id ? { ...x, isRead: true } : x
                  );
                });
                setNotifications((prev) =>
                  prev.map((x) =>
                    x.id === id ? { ...x, isRead: true } : x
                  )
                );
              }}
              onDismissed={(id) => {
                setAllItems((prev) => {
                  const target = prev.find((x) => x.id === id);
                  if (target && !target.isRead) {
                    setUnreadCount((c) => Math.max(0, c - 1));
                  }
                  return prev.filter((x) => x.id !== id);
                });
                setNotifications((prev) => prev.filter((x) => x.id !== id));
              }}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-xs font-semibold text-green-primary"
            onClick={() => load(page + 1, true)}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
