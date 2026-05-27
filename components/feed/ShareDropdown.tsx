"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function ShareDropdown({
  postId,
  onClose,
  onReposted,
}: {
  postId: string;
  onClose: () => void;
  onReposted: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const copyLink = async () => {
    const res = await fetch(`/api/posts/${postId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "copy-link" }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to copy link");
      return;
    }

    const href = `${window.location.origin}${json.url}`;
    await navigator.clipboard.writeText(href);
    setCopied(true);
    toast.success("Link copied!");
    window.setTimeout(() => setCopied(false), 2000);
    onClose();
  };

  const repost = async () => {
    const res = await fetch(`/api/posts/${postId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "repost" }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to repost");
      return;
    }
    toast.success("Reposted to your feed!");
    onReposted();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-[#e5ddd0] bg-[#faf6ef] p-1 shadow-none"
    >
      <button
        type="button"
        onClick={copyLink}
        className="w-full rounded-lg px-3 py-2 text-left text-xs text-text-mid transition-colors hover:bg-[#f2ede3]"
      >
        {copied ? "Copied!" : "📋 Copy link"}
      </button>
      <button
        type="button"
        onClick={repost}
        className="w-full rounded-lg px-3 py-2 text-left text-xs text-text-mid transition-colors hover:bg-[#f2ede3]"
      >
        🔁 Repost to feed
      </button>
    </div>
  );
}

