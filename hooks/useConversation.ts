import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";

export function useConversation(
  conversationId: string,
  callbacks: {
    onNewMessage: (msg: any) => void;
    onMessagesRead: (readBy: string) => void;
    onTyping: (userId: string, isTyping: boolean) => void;
  }
) {
  useEffect(() => {
    if (!conversationId) return;

    const channel = pusherClient.subscribe(`conversation-${conversationId}`);
    channel.bind("new-message", ({ message }: { message: any }) =>
      callbacks.onNewMessage(message)
    );
    channel.bind("messages-read", ({ readBy }: { readBy: string }) =>
      callbacks.onMessagesRead(readBy)
    );
    channel.bind(
      "typing",
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) =>
        callbacks.onTyping(userId, isTyping)
    );

    return () => {
      pusherClient.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);
}

