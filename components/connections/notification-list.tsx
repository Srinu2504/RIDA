"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  IconUserCheck,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  connectionId?: string | null;
}

export function NotificationList() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (res.ok) setItems(json.notifications);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleConnection = async (
    connectionId: string,
    status: "ACCEPTED" | "REJECTED",
    notifId: string
  ) => {
    const res = await fetch(`/api/connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Action failed");
      return;
    }
    await markRead(notifId);
    toast.success(status === "ACCEPTED" ? "Connected" : "Declined");
    load();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px] space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-xs text-text-muted">
        No alerts yet.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] space-y-2.5">
      {items.map((n) => {
        const isRequest = n.type === "CONNECTION_REQUEST";
        const Icon =
          n.type === "CONNECTION_ACCEPTED"
            ? IconUserCheck
            : IconUserPlus;

        return (
          <div
            key={n.id}
            className={cn(
              "rida-card flex items-center gap-3 rounded-[10px] px-3.5 py-3",
              !n.isRead && "border-l-2 border-l-green-primary"
            )}
            onClick={() => !n.isRead && !isRequest && markRead(n.id)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-green-pale">
              <Icon size={18} className="text-green-primary" stroke={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-dark">{n.message}</p>
              <p className="text-[10px] text-text-muted">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {isRequest && n.connectionId && (
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnection(n.connectionId!, "ACCEPTED", n.id);
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnection(n.connectionId!, "REJECTED", n.id);
                  }}
                >
                  <IconX size={14} />
                </Button>
              </div>
            )}
            {!isRequest && (
              <span className="shrink-0 text-[10px] text-text-faint">
                {formatTime(n.createdAt)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString();
}
