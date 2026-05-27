"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageInput({
  conversationId,
  onSend,
}: {
  conversationId: string;
  onSend: (content: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const stopTypingTimer = useRef<number | null>(null);
  const typingDebounce = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fireTyping = (isTyping: boolean) => {
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, isTyping }),
    }).catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (stopTypingTimer.current) window.clearTimeout(stopTypingTimer.current);
      if (typingDebounce.current) window.clearTimeout(typingDebounce.current);
    };
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 140); // ~4 lines
    el.style.height = `${next}px`;
  }, [value]);

  const scheduleTyping = () => {
    if (typingDebounce.current) window.clearTimeout(typingDebounce.current);
    typingDebounce.current = window.setTimeout(() => fireTyping(true), 500);

    if (stopTypingTimer.current) window.clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = window.setTimeout(() => fireTyping(false), 2000);
  };

  const submit = async () => {
    const content = value.trim();
    if (!content) return;
    setSending(true);
    try {
      await onSend(content);
      setValue("");
      fireTyping(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-end gap-2 border-t-[0.5px] border-cream-divider bg-cream-surface p-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          const next = e.target.value.slice(0, 2000);
          setValue(next);
          scheduleTyping();
        }}
        placeholder="Write a message…"
        className="min-h-[42px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button
        onClick={submit}
        disabled={sending || value.trim().length === 0}
        className="h-[42px] px-5"
      >
        Send
      </Button>
    </div>
  );
}

