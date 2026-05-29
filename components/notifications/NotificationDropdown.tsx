"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NotificationItem } from "@/components/notifications/notification-item";
import { type AppNotification } from "@/hooks/useNotifications";

export function NotificationDropdown({
  open,
  onClose,
  notifications,
  onMarkedRead,
  onDismissed,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkedRead: (id: string) => void;
  onDismissed: (id: string) => void;
  onMarkAllRead: () => void;
}) {
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
          <div
            key={n.id}
            className={`border-b border-[#e5ddd0] px-3 py-3 ${
              n.isRead
                ? "bg-[#faf6ef]"
                : "border-l-4 border-l-[#2d6a4f] bg-[#f0f7f4]"
            }`}
          >
            <NotificationItem
              notification={n}
              avatarSize={28}
              onMarkedRead={onMarkedRead}
              onDismissed={onDismissed}
              onNavigate={onClose}
            />
          </div>
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
