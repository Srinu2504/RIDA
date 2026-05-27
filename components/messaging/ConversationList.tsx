"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { ConversationListItem } from "@/lib/stores/messaging-store";

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationListItem[];
  activeId: string | null;
  onSelect: (conversationId: string) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) =>
      c.otherDoctor.name.toLowerCase().includes(query)
    );
  }, [q, conversations]);

  return (
    <div className="flex h-full flex-col border-r-[0.5px] border-cream-border bg-cream-surface">
      <div className="p-3">
        <input
          className="rida-input h-9 w-full"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((c) => {
          const active = c.id === activeId;
          const ts = c.lastMessageAt ? relativeTime(new Date(c.lastMessageAt)) : "";

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full border-b-[0.5px] border-cream-divider px-3 py-3 text-left transition-colors",
                active
                  ? "bg-cream-bg border-l-4 border-l-green-primary"
                  : "hover:bg-green-pale"
              )}
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  name={c.otherDoctor.name}
                  src={c.otherDoctor.avatar}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-text-dark">
                      {c.otherDoctor.name}
                    </p>
                    <p className="shrink-0 text-[10px] text-text-muted">{ts}</p>
                  </div>
                  {c.otherDoctor.specialty && (
                    <p className="text-[10px] font-bold text-green-primary">
                      {c.otherDoctor.specialty}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-text-muted">
                      {truncate(c.lastMessagePreview || "", 40)}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-primary px-1 text-[10px] font-bold text-cream-surface">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-3 py-10 text-center text-xs text-text-muted">
            No conversations found.
          </p>
        )}
      </div>
    </div>
  );
}

