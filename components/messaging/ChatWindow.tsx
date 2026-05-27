"use client";

import { useEffect, useMemo, useRef } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

function dayLabel(d: Date) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.floor(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ChatWindow({
  currentUserId,
  otherDoctor,
  messages,
  otherIsTyping,
}: {
  currentUserId: string;
  otherDoctor: { name: string; avatar: string | null; specialty: string };
  messages: ChatMessage[];
  otherIsTyping: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherIsTyping]);

  const items = useMemo(() => {
    const out: Array<
      | { type: "day"; id: string; label: string }
      | { type: "msg"; id: string; msg: ChatMessage }
    > = [];
    let lastDay = "";
    for (const m of messages) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== lastDay) {
        lastDay = key;
        out.push({ type: "day", id: `day-${key}`, label: dayLabel(d) });
      }
      out.push({ type: "msg", id: m.id, msg: m });
    }
    return out;
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-cream-bg">
      <div className="flex items-center justify-between border-b-[0.5px] border-cream-border bg-cream-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={otherDoctor.name} src={otherDoctor.avatar} size={38} />
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-text-dark">
              {otherDoctor.name}
            </p>
            <p className="text-[11px] font-bold text-green-primary">
              {otherDoctor.specialty}
            </p>
          </div>
        </div>
        <span className="rounded-[999px] border-[0.5px] border-cream-border bg-cream-surface px-3 py-1 text-[10px] font-semibold text-text-muted">
          Connected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {items.map((it) => {
            if (it.type === "day") {
              return (
                <div key={it.id} className="flex justify-center py-1">
                  <span className="rounded-[999px] border-[0.5px] border-cream-border bg-cream-surface px-3 py-1 text-[10px] font-semibold text-text-muted">
                    {it.label}
                  </span>
                </div>
              );
            }

            const m = it.msg;
            const mine = m.senderId === currentUserId;
            const created = new Date(m.createdAt);

            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[78%]">
                  <div
                    className={cn(
                      "px-3 py-2 text-xs leading-relaxed",
                      mine
                        ? "rounded-2xl rounded-br-sm bg-green-primary text-cream-surface"
                        : "rounded-2xl rounded-bl-sm border-[0.5px] border-cream-border bg-cream-surface text-text-dark"
                    )}
                  >
                    {m.content}
                  </div>

                  <div
                    className={cn(
                      "mt-1 flex items-center gap-2 text-[10px]",
                      mine ? "justify-end" : "justify-start"
                    )}
                  >
                    <span className={mine ? "text-white/70" : "text-text-muted"}>
                      {timeLabel(created)}
                    </span>

                    {mine && (
                      <span
                        className="select-none"
                        title={m.readAt ? `Read at ${timeLabel(new Date(m.readAt))}` : ""}
                      >
                        <span className={m.isRead ? "text-green-primary" : "text-[#9ca3af]"}>
                          {m.isRead ? "✓✓" : "✓"}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {otherIsTyping && <TypingIndicator name={otherDoctor.name} />}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

