"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { IconChevronDown } from "@tabler/icons-react";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow, type ChatMessage } from "@/components/messaging/ChatWindow";
import { MessageInput } from "@/components/messaging/MessageInput";
import { useConversation } from "@/hooks/useConversation";
import { useMessagingStore } from "@/lib/stores/messaging-store";
import { useUser } from "@/components/shared/user-context";
import { getPusherClient } from "@/lib/pusher";
import { cn } from "@/lib/utils";

const MASCOT_SRC = "/rida-mascot.png";
const MASCOT_W = 91;
const MASCOT_H = 77;

export function MessagingMascot() {
  const user = useUser();
  const userId = user?.id ?? "";
  const pathname = usePathname();

  const {
    widgetOpen,
    setWidgetOpen,
    activeConversationId,
    setActiveConversationId,
    conversations,
    setConversations,
    totalUnread,
  } = useMessagingStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const hasUnread = totalUnread > 0;

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load conversations");
    setConversations(json.conversations ?? []);
  }, [setConversations]);

  const markRead = useCallback(
    async (conversationId: string) => {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      }).catch(() => {});
      await loadConversations().catch(() => {});
    },
    [loadConversations]
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load messages");
      const newestFirst = json.messages as ChatMessage[];
      setMessages([...newestFirst].reverse());
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadConversations().catch(() => {});
  }, [userId, loadConversations]);

  useEffect(() => {
    if (!userId) return;
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`user-${userId}`);
    channel.bind("unread-update", () => loadConversations().catch(() => {}));

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId, loadConversations]);

  useEffect(() => {
    if (widgetOpen) {
      const t = requestAnimationFrame(() => setPanelVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setPanelVisible(false);
  }, [widgetOpen]);

  useEffect(() => {
    if (!activeConversationId || !widgetOpen) return;
    loadMessages(activeConversationId).catch(() =>
      toast.error("Failed to load messages")
    );
    markRead(activeConversationId);
  }, [activeConversationId, widgetOpen, loadMessages, markRead]);

  useConversation(activeConversationId ?? "", {
    onNewMessage: (msg) => {
      setMessages((m) => [...m, msg]);
      loadConversations().catch(() => {});
      if (msg.senderId !== userId && widgetOpen) {
        markRead(msg.conversationId);
      }
    },
    onMessagesRead: (readBy) => {
      if (readBy === userId) return;
      setMessages((ms) =>
        ms.map((m) =>
          m.senderId === userId
            ? { ...m, isRead: true, readAt: new Date().toISOString() }
            : m
        )
      );
      loadConversations().catch(() => {});
    },
    onTyping: (typingUserId, isTyping) => {
      if (typingUserId === userId) return;
      setOtherIsTyping(isTyping);
    },
  });

  const handleSend = async (content: string) => {
    if (!activeConversationId) return;
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConversationId, content }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to send");
      return;
    }
    if (json.message?.id) setMessages((m) => [...m, json.message]);
    loadConversations().catch(() => {});
  };

  const closePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setWidgetOpen(false), 280);
  };

  const openPanel = () => {
    setWidgetOpen(true);
  };

  if (!userId || pathname.startsWith("/messages")) return null;

  return (
    <div
      className={cn(
        "fixed z-40 flex flex-col items-end gap-4",
        widgetOpen
          ? "bottom-[5.75rem] right-3 sm:bottom-6 sm:right-5"
          : "bottom-[4.75rem] right-3 sm:bottom-5 sm:right-4",
        widgetOpen ? "w-[min(100vw-24px,360px)]" : "w-auto"
      )}
    >
      {widgetOpen && (
        <div
          className={cn(
            "rida-msg-panel relative z-10 flex w-full max-h-[min(400px,calc(100vh-13rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl",
            panelVisible ? "rida-msg-panel--visible" : "rida-msg-panel--hidden",
            hasUnread ? "border-green-primary" : "border-[#d6cec4]"
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-between gap-2 px-3 py-2.5",
              hasUnread
                ? "bg-green-primary text-white"
                : "border-b border-[#d6cec4] bg-white text-text-dark"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src={MASCOT_SRC}
                alt=""
                width={25}
                height={21}
                className="h-6 w-7 object-contain"
                aria-hidden
              />
              <span className="truncate text-sm font-bold">Messaging</span>
              {hasUnread && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-green-primary">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/messages"
                className={cn(
                  "rounded px-2 py-1 text-[10px] font-semibold hover:underline",
                  hasUnread ? "text-white/90" : "text-green-primary"
                )}
                onClick={() => setWidgetOpen(false)}
              >
                Open full
              </Link>
              <button
                type="button"
                aria-label="Close messages"
                onClick={closePanel}
                className={cn(
                  "rounded p-1",
                  hasUnread ? "hover:bg-white/15" : "hover:bg-[#f3f2ef]"
                )}
              >
                <IconChevronDown size={18} />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-white">
            {activeConversationId && active ? (
              <>
                <div className="flex items-center gap-2 border-b border-[#e5ddd0] px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConversationId(null);
                      setMessages([]);
                    }}
                    className="rounded px-2 py-1 text-[11px] font-semibold text-green-primary hover:bg-green-pale"
                  >
                    ← All
                  </button>
                  <span className="truncate text-xs font-bold text-text-dark">
                    {active.otherDoctor.name}
                  </span>
                </div>
                <div className="h-[280px] min-h-0 sm:h-[300px]">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center bg-cream-bg">
                      <p className="text-xs text-text-muted">Loading…</p>
                    </div>
                  ) : (
                    <ChatWindow
                      currentUserId={userId}
                      otherDoctor={active.otherDoctor}
                      messages={messages}
                      otherIsTyping={otherIsTyping}
                    />
                  )}
                </div>
                <MessageInput
                  conversationId={activeConversationId}
                  onSend={handleSend}
                />
              </>
            ) : (
              <div className="h-[340px] min-h-0 sm:h-[360px]">
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={setActiveConversationId}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => (widgetOpen ? closePanel() : openPanel())}
        aria-label={
          widgetOpen
            ? "Close messages"
            : hasUnread
              ? `Open messages, ${totalUnread} unread`
              : "Open messages"
        }
        aria-expanded={widgetOpen}
        className={cn(
          "rida-mascot-link relative z-20 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2",
          widgetOpen && "rida-mascot-link--open"
        )}
      >
        <span
          className={cn(
            "rida-mascot-glow relative block transition-shadow duration-300",
            hasUnread && !widgetOpen
              ? "rida-mascot-glow--active shadow-[0_0_0_4px_#2d6a4f,0_8px_28px_rgba(45,106,79,0.4)]"
              : "drop-shadow-[0_6px_14px_rgba(0,0,0,0.14)]"
          )}
        >
          <span className="rida-mascot-float block">
            <Image
              src={MASCOT_SRC}
              alt="RIDA messaging assistant"
              width={MASCOT_W}
              height={MASCOT_H}
              className="rida-mascot-img h-[62px] w-[77px] object-contain sm:h-[73px] sm:w-[91px]"
              priority
            />
          </span>

          {hasUnread && !widgetOpen && (
            <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-green-primary px-0.5 text-[9px] font-bold text-white shadow-sm">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
