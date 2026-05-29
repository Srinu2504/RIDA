"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { ConnectionStatus, DoctorSearchResult } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatProfileName, formatRoleLabel } from "@/lib/user-display";
import { SPECIALTIES } from "@/lib/validations";
import { RidaNewsPanel } from "@/components/feed/rida-news-panel";
import { cn } from "@/lib/utils";

interface FeedSidebarProps {
  suggestions: DoctorSearchResult[];
  feedRefreshKey?: number;
}

export function FeedSidebar({
  suggestions,
  feedRefreshKey = 0,
}: FeedSidebarProps) {
  const [people, setPeople] = useState(suggestions);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    setPeople(suggestions);
  }, [suggestions]);

  const setConnectionStatus = (userId: string, status: ConnectionStatus) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, connectionStatus: status } : p
      )
    );
  };

  const handleConnect = async (userId: string) => {
    setConnecting(userId);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      const json = await res.json();
      if (res.status === 409) {
        const status = (json.status as ConnectionStatus) ?? "PENDING";
        setConnectionStatus(userId, status);
        toast.error(json.error ?? "Request already sent");
        return;
      }
      if (!res.ok) {
        toast.error(json.error ?? "Failed");
        return;
      }
      setConnectionStatus(userId, "PENDING");
      toast.success("Request sent");
    } catch {
      toast.error("Failed to connect");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <aside className="hidden w-full shrink-0 flex-col gap-2 lg:flex lg:w-[300px]">
      <RidaNewsPanel refreshKey={feedRefreshKey} />

      <div className="feed-card p-3">
        <h3 className="mb-3 text-sm font-bold text-text-dark">
          People you may know
        </h3>
        <ul className="space-y-3">
          {people.slice(0, 5).map((doc) => {
            const status = doc.connectionStatus;
            const isPending = status === "PENDING";
            const isConnected = status === "ACCEPTED";
            const label = isConnected
              ? "Connected"
              : isPending
                ? "Pending"
                : "+ Connect";

            return (
            <li key={doc.userId} className="flex items-start gap-2">
              <UserAvatar
                name={`${doc.firstName} ${doc.lastName}`}
                src={doc.profilePhoto}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${doc.userId}`}
                  className="block truncate text-xs font-bold text-text-dark hover:text-green-primary hover:underline"
                >
                  {formatProfileName(
                    doc.role ?? "PRACTICING_PHYSICIAN",
                    doc.firstName,
                    doc.lastName
                  )}
                </Link>
                {doc.role === "MEDICAL_STUDENT" && (
                  <p className="truncate text-[10px] font-semibold text-text-muted">
                    {formatRoleLabel(doc.role)}
                  </p>
                )}
                <p className="truncate text-[10px] text-text-muted">
                  {doc.specialty}
                </p>
                <button
                  type="button"
                  disabled={
                    connecting === doc.userId || isPending || isConnected
                  }
                  onClick={() => handleConnect(doc.userId)}
                  className={cn(
                    "mt-2 rounded-full border px-3 py-0.5 text-[11px] font-bold transition-colors disabled:opacity-60",
                    isConnected
                      ? "border-green-primary bg-green-pale text-green-primary"
                      : isPending
                        ? "border-text-muted bg-[#f0ebe3] text-text-muted"
                        : "border-text-muted text-text-muted hover:border-green-primary hover:bg-green-pale hover:text-green-primary"
                  )}
                >
                  {connecting === doc.userId ? "Sending…" : label}
                </button>
              </div>
            </li>
            );
          })}
          {people.length === 0 && (
            <p className="text-xs text-text-muted">No suggestions yet</p>
          )}
        </ul>
      </div>

      <div className="feed-card p-3">
        <h3 className="mb-2 text-sm font-bold text-text-dark">
          Browse by specialty
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {SPECIALTIES.slice(0, 6).map((s) => (
            <li key={s}>
              <Link
                href={`/search?q=${encodeURIComponent(s)}`}
                className="inline-block rounded-full border border-[#d6cec4] px-2.5 py-1 text-[10px] font-semibold text-text-mid transition-colors hover:border-green-primary hover:bg-green-pale hover:text-green-primary"
              >
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
