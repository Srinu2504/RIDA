"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { PageBackHeader } from "@/components/shared/page-back-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { type AppNotification, useNotifications } from "@/hooks/useNotifications";

type Filter = "all" | "unread" | "likes" | "comments" | "connections" | "messages";

function dayLabel(date: string) {
  const d = new Date(date);
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (startNow.getTime() - startD.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
  const router = useRouter();
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

  const grouped = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    for (const n of filtered) {
      const key = dayLabel(n.createdAt);
      map.set(key, [...(map.get(key) ?? []), n]);
    }
    return Array.from(map.entries());
  }, [filtered]);

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

      {grouped.length === 0 && (
        <div className="rida-card flex flex-col items-center gap-2 py-12">
          <Bell className="text-text-muted" size={20} />
          <p className="text-xs text-text-muted">No notifications yet</p>
        </div>
      )}

      <div className="space-y-5">
        {grouped.map(([group, items]) => (
          <div key={group}>
            <p className="mb-2 text-xs font-bold text-text-dark">{group}</p>
            <div className="space-y-2">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={async () => {
                    if (!n.isRead) {
                      await fetch("/api/notifications/read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notificationId: n.id }),
                      });
                      setAllItems((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
                      );
                      setUnreadCount((c) => Math.max(0, c - 1));
                    }
                    router.push(n.link);
                  }}
                  className={`w-full rounded-xl border border-[#e5ddd0] px-3 py-3 text-left ${
                    n.isRead
                      ? "bg-[#faf6ef]"
                      : "border-l-4 border-l-[#2d6a4f] bg-[#f0f7f4]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <UserAvatar
                      name={n.actor?.name ?? "User"}
                      src={n.actor?.avatar}
                      size={30}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-mid">{n.text}</p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
