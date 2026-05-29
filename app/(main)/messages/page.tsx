"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow, type ChatMessage } from "@/components/messaging/ChatWindow";
import { MessageInput } from "@/components/messaging/MessageInput";
import { useConversation } from "@/hooks/useConversation";
import { useMessagingStore, type ConversationListItem } from "@/lib/stores/messaging-store";
import { useUser } from "@/components/shared/user-context";

export default function MessagesPage() {
  const user = useUser();
  const userId = user?.id ?? "";
  const router = useRouter();
  const params = useSearchParams();

  const {
    activeConversationId,
    setActiveConversationId,
    conversations,
    setConversations,
  } = useMessagingStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);

  const active = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  }, [conversations, activeConversationId]);

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    router.push(`/messages?conversation=${encodeURIComponent(id)}`);
  };

  const loadConversations = async () => {
    const res = await fetch("/api/conversations");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load conversations");
    setConversations(json.conversations as ConversationListItem[]);
  };

  const loadMessages = async (conversationId: string) => {
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
  };

  const markRead = async (conversationId: string) => {
    await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).catch(() => {});
  };

  useEffect(() => {
    if (!userId) return;
    loadConversations().catch(() => toast.error("Failed to load conversations"));
  }, [userId]);

  useEffect(() => {
    const fromQuery = params.get("conversation");
    if (!fromQuery) return;
    setActiveConversationId(fromQuery);
  }, [params]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId).catch(() =>
      toast.error("Failed to load messages")
    );
    markRead(activeConversationId);
  }, [activeConversationId]);

  useConversation(activeConversationId ?? "", {
    onNewMessage: (msg) => {
      setMessages((m) => [...m, msg]);
      loadConversations().catch(() => {});
      if (msg.senderId !== userId) markRead(msg.conversationId);
    },
    onMessagesRead: (readBy) => {
      if (readBy === userId) return;
      setMessages((ms) =>
        ms.map((m) =>
          m.senderId === userId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
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
    // Optimistic update happens via Pusher; add fallback just in case.
    if (json.message?.id) setMessages((m) => [...m, json.message]);
    loadConversations().catch(() => {});
  };

  return (
    <div className="mx-auto h-[calc(100vh-56px)] max-w-[1200px] px-0 md:px-6">
      <div className="h-full md:py-6">
        <div className="h-full overflow-hidden border-y-[0.5px] border-cream-border bg-cream-surface md:rounded-xl md:border-[0.5px]">
          <div className="flex h-full">
            <div
              className={[
                "h-full w-full md:w-[360px]",
                activeConversationId ? "hidden md:block" : "block",
              ].join(" ")}
            >
              <ConversationList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={selectConversation}
              />
            </div>

            <div
              className={[
                "flex h-full w-full flex-col",
                activeConversationId ? "block" : "hidden md:flex",
              ].join(" ")}
            >
              {!activeConversationId || !active ? (
                <div className="flex h-full items-center justify-center bg-cream-bg">
                  <p className="text-xs text-text-muted">
                    Select a conversation to start messaging.
                  </p>
                </div>
              ) : (
                <>
                  <div className="md:hidden border-b-[0.5px] border-cream-border bg-cream-surface px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setActiveConversationId(null)}
                      className="text-xs font-semibold text-green-primary"
                    >
                      ← Back
                    </button>
                  </div>

                  <div className="flex-1">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

