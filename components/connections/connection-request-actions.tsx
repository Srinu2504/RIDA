"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { respondToConnection } from "@/lib/connection-actions";

export function ConnectionRequestActions({
  connectionId,
  notificationId,
  onDone,
  onDismiss,
  size = "sm",
}: {
  connectionId: string;
  notificationId?: string;
  onDone?: (status: "ACCEPTED" | "REJECTED") => void;
  /** Remove this alert from the list immediately (server also dismisses it). */
  onDismiss?: () => void;
  size?: "sm" | "default";
}) {
  const [busy, setBusy] = useState(false);

  const markRead = async () => {
    if (!notificationId) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    }).catch(() => {});
  };

  const handle = async (status: "ACCEPTED" | "REJECTED") => {
    setBusy(true);
    try {
      await respondToConnection(connectionId, status);
      await markRead();
      onDismiss?.();
      toast.success(status === "ACCEPTED" ? "Connected!" : "Request declined");
      onDone?.(status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex shrink-0 gap-1.5">
      <Button
        type="button"
        size={size}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          handle("ACCEPTED");
        }}
      >
        {busy ? "…" : "Accept"}
      </Button>
      <Button
        type="button"
        size={size}
        variant="danger"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          handle("REJECTED");
        }}
      >
        Decline
      </Button>
    </div>
  );
}
