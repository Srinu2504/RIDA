import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";

export function useConversation(
  conversationId: string,
  callbacks: {
    onNewMessage: (msg: any) => void;
    onMessagesRead: (readBy: string) => void;
    onTyping: (userId: string, isTyping: boolean) => void;
  }
) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!conversationId) return;
    const pusherClient = getPusherClient();
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`conversation-${conversationId}`);
    channel.bind("new-message", ({ message }: { message: any }) =>
      callbacksRef.current.onNewMessage(message)
    );
    channel.bind("messages-read", ({ readBy }: { readBy: string }) =>
      callbacksRef.current.onMessagesRead(readBy)
    );
    channel.bind(
      "typing",
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) =>
        callbacksRef.current.onTyping(userId, isTyping)
    );

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);
}

