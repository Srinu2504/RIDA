"use client";

import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConnectionRequestActions } from "@/components/connections/connection-request-actions";
import { type AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

async function markNotificationRead(notificationId: string) {
  await fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId }),
  });
}

export function NotificationItem({
  notification: n,
  avatarSize = 30,
  className,
  onMarkedRead,
  onDismissed,
  onNavigate,
}: {
  notification: AppNotification;
  avatarSize?: number;
  className?: string;
  onMarkedRead?: (id: string) => void;
  onDismissed?: (id: string) => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const isConnectionRequest =
    n.type === "connection_request" && n.connectionId;

  const open = async () => {
    if (!n.isRead) {
      await markNotificationRead(n.id).catch(() => {});
      onMarkedRead?.(n.id);
    }
    onNavigate?.();
    router.push(n.link);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        className
      )}
    >
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-2 rounded-md text-left transition-colors hover:bg-black/[0.03]",
          isConnectionRequest ? "pr-1" : "w-full"
        )}
      >
        <UserAvatar
          name={n.actor?.name ?? "User"}
          src={n.actor?.avatar}
          size={avatarSize}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-mid">{n.text}</p>
          <p className="text-[10px] text-text-muted">
            {formatTime(n.createdAt)}
          </p>
        </div>
      </button>

      {isConnectionRequest && (
        <ConnectionRequestActions
          connectionId={n.connectionId!}
          notificationId={n.id}
          onDismiss={() => onDismissed?.(n.id)}
          onDone={onNavigate}
        />
      )}
    </div>
  );
}

function formatTime(date: string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}
