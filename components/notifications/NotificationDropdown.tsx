"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import { type AppNotification } from "@/hooks/useNotifications";

function formatTime(date: string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

export function NotificationDropdown({
  open,
  onClose,
  notifications,
  onMarkedRead,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkedRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = notifications.slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-10 z-50 w-[380px] max-h-[480px] overflow-hidden rounded-xl border border-[#e5ddd0] bg-[#faf6ef]"
    >
      <div className="flex items-center justify-between border-b border-[#e5ddd0] px-3 py-2">
        <p className="text-xs font-bold text-text-dark">Notifications</p>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await fetch("/api/notifications/read", { method: "POST" });
            onMarkAllRead();
            setLoading(false);
          }}
          className="text-[11px] font-semibold text-green-primary"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {latest.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-text-muted">
            No notifications yet
          </p>
        )}

        {latest.map((n) => (
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
                onMarkedRead(n.id);
              }
              onClose();
              router.push(n.link);
            }}
            className={`w-full border-b border-[#e5ddd0] px-3 py-3 text-left ${
              n.isRead
                ? "bg-[#faf6ef]"
                : "border-l-4 border-l-[#2d6a4f] bg-[#f0f7f4]"
            }`}
          >
            <div className="flex items-start gap-2">
              <UserAvatar
                name={n.actor?.name ?? "User"}
                src={n.actor?.avatar}
                size={28}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-mid">{n.text}</p>
                <p className="text-[10px] text-text-muted">{formatTime(n.createdAt)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Link
        href="/notifications"
        className="block border-t border-[#e5ddd0] px-3 py-2 text-center text-xs font-semibold text-green-primary"
        onClick={onClose}
      >
        View all notifications →
      </Link>
    </div>
  );
}

