"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { IconChevronDown, IconChevronUp, IconMessage } from "@tabler/icons-react";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow, type ChatMessage } from "@/components/messaging/ChatWindow";
import { MessageInput } from "@/components/messaging/MessageInput";
import { useConversation } from "@/hooks/useConversation";
import { useMessagingStore } from "@/lib/stores/messaging-store";
import { useUser } from "@/components/shared/user-context";
import { getPusherClient } from "@/lib/pusher";
import { cn } from "@/lib/utils";

export function MessagingWidget() {
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

  const active = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const hasUnread = totalUnread > 0;

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load conversations");
    setConversations(json.conversations ?? []);
  }, [setConversations]);

  const markRead = useCallback(async (conversationId: string) => {
    await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).catch(() => {});
    await loadConversations().catch(() => {});
  }, [loadConversations]);

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

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const backToList = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  if (!userId || pathname.startsWith("/messages")) return null;

  return (
    <div
      className={cn(
        "fixed z-40 flex flex-col",
        "bottom-[72px] right-3 sm:bottom-4 sm:right-4",
        widgetOpen ? "w-[min(100vw-24px,360px)]" : "w-[280px]"
      )}
    >
      {widgetOpen ? (
        <div
          className={cn(
            "flex max-h-[min(520px,calc(100vh-120px))] flex-col overflow-hidden rounded-t-xl border border-[#d6cec4] shadow-xl",
            hasUnread ? "border-green-primary" : "border-[#d6cec4]"
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-between px-3 py-2.5 transition-colors",
              hasUnread
                ? "bg-green-primary text-white"
                : "border-b border-[#d6cec4] bg-white text-text-dark"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <IconMessage size={18} stroke={2} />
              <span className="truncate text-sm font-bold">Messaging</span>
              {hasUnread && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    hasUnread
                      ? "bg-white text-green-primary"
                      : "bg-green-primary text-white"
                  )}
                >
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
                aria-label="Minimize messaging"
                onClick={() => setWidgetOpen(false)}
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
                    onClick={backToList}
                    className="rounded px-2 py-1 text-[11px] font-semibold text-green-primary hover:bg-green-pale"
                  >
                    ← All
                  </button>
                  <span className="truncate text-xs font-bold text-text-dark">
                    {active.otherDoctor.name}
                  </span>
                </div>
                <div className="h-[340px] min-h-0">
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
              <div className="h-[400px] min-h-0">
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={selectConversation}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setWidgetOpen(true)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-t-xl border px-4 py-3 shadow-lg transition-colors",
            hasUnread
              ? "border-green-primary bg-green-primary text-white hover:bg-[#255a43]"
              : "border-[#d6cec4] bg-white text-text-dark hover:bg-[#f9f7f4]"
          )}
        >
          <div className="flex items-center gap-2">
            <IconMessage size={20} stroke={2} />
            <span className="text-sm font-bold">Messaging</span>
            {hasUnread && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-green-primary">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <IconChevronUp size={18} />
        </button>
      )}
    </div>
  );
}