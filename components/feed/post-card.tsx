"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconBookmark,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconPhoto,
  IconShare,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CommentSection } from "@/components/feed/CommentSection";
import { ShareDropdown } from "@/components/feed/ShareDropdown";
import { usePost } from "@/hooks/usePost";

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  "Case Study": { bg: "bg-green-light", text: "text-green-primary" },
  Article: { bg: "bg-[#dde8fc]", text: "text-[#2d4a8a]" },
  Update: { bg: "bg-[#fde8d0]", text: "text-[#8a5a30]" },
  Photo: { bg: "bg-[#ede8fc]", text: "text-[#5a4a8a]" },
};

interface FeedItem {
  type: "post" | "repost";
  repostedByName?: string;
  post: {
    id: string;
    authorId: string;
    tag: string;
    body: string;
    imageUrl?: string | null;
    likeCount: number;
    commentCount: number;
    saveCount: number;
    repostCount: number;
    createdAt: string;
    authorName: string;
    profilePhoto?: string | null;
    specialty?: string | null;
    hospitalName?: string | null;
    liked: boolean;
    saved: boolean;
  };
}

function relativeTime(input: string) {
  const d = new Date(input);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function PostCard({
  item,
  currentUserId,
  onRefresh,
}: {
  item: FeedItem;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const [liked, setLiked] = useState(item.post.liked);
  const [saved, setSaved] = useState(item.post.saved);
  const [likeCount, setLikeCount] = useState(Number(item.post.likeCount ?? 0));
  const [commentCount, setCommentCount] = useState(Number(item.post.commentCount ?? 0));
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [heartBounce, setHeartBounce] = useState(false);
  const [incomingComment, setIncomingComment] = useState<any>(null);

  usePost(item.post.id, {
    onLikeUpdated: (data) => {
      setLikeCount(data.likeCount);
      if (data.likedBy === currentUserId) setLiked(data.action === "liked");
    },
    onNewComment: (comment) => {
      setCommentCount((x) => x + 1);
      setIncomingComment(comment);
    },
  });

  const tagStyle = TAG_STYLES[item.post.tag] ?? TAG_STYLES.Update;

  const toggleLike = async () => {
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 200);
    setLiked((x) => !x);
    setLikeCount((x) => x + (liked ? -1 : 1));
    const res = await fetch(`/api/posts/${item.post.id}/like`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update like");
      setLiked(item.post.liked);
      setLikeCount(item.post.likeCount);
      return;
    }
    setLiked(json.liked);
    setLikeCount(json.likeCount);
  };

  const toggleSave = async () => {
    setSaved((x) => !x);
    const res = await fetch(`/api/posts/${item.post.id}/save`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to save");
      setSaved(item.post.saved);
      return;
    }
    setSaved(json.saved);
    toast.success(json.saved ? "Post saved!" : "Post unsaved");
  };

  return (
    <article
      id={`post-${item.post.id}`}
      className="feed-card scroll-mt-24 overflow-visible"
    >
      {item.type === "repost" && (
        <div className="border-b border-[#ebe6dc] bg-[#f8f6f1] px-3.5 py-2 text-[11px] font-semibold text-text-muted">
          🔁 {item.repostedByName} reposted
        </div>
      )}

      <header className="flex items-start gap-3 px-3.5 pb-3 pt-3.5">
        <UserAvatar name={item.post.authorName} src={item.post.profilePhoto} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-text-dark">{item.post.authorName}</span>
            <span className={`rida-tag ${tagStyle.bg} ${tagStyle.text}`}>{item.post.tag}</span>
          </div>
          <p className="text-[10px] text-text-muted">
            {item.post.specialty ?? "Doctor"}
            {item.post.hospitalName ? ` · ${item.post.hospitalName}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-[10px] text-text-faint">{relativeTime(item.post.createdAt)}</span>
      </header>

      <div className="px-3.5 pb-3">
        <p className="text-xs leading-relaxed text-text-mid">{item.post.body}</p>
      </div>

      {item.post.imageUrl && (
        <div className="relative w-full bg-[#f8f6f1]">
          {item.post.imageUrl.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.post.imageUrl}
              alt="Post"
              className="max-h-[420px] w-full object-contain"
            />
          ) : (
            <div className="relative min-h-[120px] w-full">
              <Image
                src={item.post.imageUrl}
                alt="Post"
                width={560}
                height={320}
                className="max-h-[420px] w-full object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
      )}

      <footer className="border-t border-[#e5ddd0] px-3.5 py-2.5">
        <div className="flex items-center gap-4 text-[11px]">
          <button
            type="button"
            className="flex items-center gap-1 text-[#8a7f6e] transition-colors hover:text-green-primary"
            onClick={toggleLike}
          >
            <span className={`transition-transform ${heartBounce ? "scale-125" : "scale-100"}`}>
              {liked ? (
                <IconHeartFilled size={15} className="text-[#ef4444]" />
              ) : (
                <IconHeart size={15} stroke={1.5} />
              )}
            </span>
            {likeCount} Likes
          </button>

          <button
            type="button"
            className="flex items-center gap-1 text-[#8a7f6e] transition-colors hover:text-green-primary"
            onClick={() => setShowComments((x) => !x)}
          >
            <IconMessage size={15} stroke={1.5} />
            {commentCount} Comments
          </button>

          <button
            type="button"
            title={saved ? "Saved" : "Save post"}
            className="flex items-center gap-1 text-[#8a7f6e] transition-colors hover:text-green-primary"
            onClick={toggleSave}
          >
            <IconBookmark
              size={15}
              stroke={1.5}
              className={saved ? "fill-[#2d6a4f] text-[#2d6a4f]" : ""}
            />
            Save
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 text-[#8a7f6e] transition-colors hover:text-green-primary"
              onClick={() => setShowShare((x) => !x)}
            >
              <IconShare size={15} stroke={1.5} />
              Share
            </button>
            {showShare && (
              <ShareDropdown postId={item.post.id} onClose={() => setShowShare(false)} onReposted={onRefresh} />
            )}
          </div>
        </div>
      </footer>

      {showComments && (
        <CommentSection
          postId={item.post.id}
          currentUserId={currentUserId}
          incomingComment={incomingComment}
          onCommentCountDelta={(delta) => setCommentCount((x) => Math.max(0, x + delta))}
        />
      )}
    </article>
  );
}

export function PostFeed({
  source = "feed",
  profileUserId,
  currentUserId = "",
  emptyMessage,
}: {
  source?: "feed" | "saved" | "profile";
  profileUserId?: string;
  currentUserId?: string;
  emptyMessage?: string;
}) {
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get("post");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const hasLoadedRef = useRef(false);
  const highlightedRef = useRef<string | null>(null);

  const endpoint = useMemo(() => {
    if (source === "saved") return "/api/posts/saved";
    if (source === "profile" && profileUserId) {
      return `/api/users/${profileUserId}/posts`;
    }
    return "/api/feed";
  }, [source, profileUserId]);

  const load = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load feed");
      setLocked(Boolean(json.locked));
      setItems(json.items ?? []);
      hasLoadedRef.current = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load feed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    hasLoadedRef.current = false;
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (source !== "feed" || !highlightPostId || loading) return;
    if (highlightedRef.current === highlightPostId) return;
    const el = document.getElementById(`post-${highlightPostId}`);
    if (!el) return;
    highlightedRef.current = highlightPostId;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-green-primary");
    const timer = setTimeout(() => {
      el.classList.remove("ring-2", "ring-green-primary");
    }, 2500);
    return () => clearTimeout(timer);
  }, [highlightPostId, loading, items, source]);

  if (loading) {
    return (
      <p className="py-8 text-center text-xs text-text-muted">
        {source === "profile" ? "Loading posts…" : "Loading feed…"}
      </p>
    );
  }

  if (locked) {
    return (
      <p className="feed-card px-4 py-8 text-center text-xs text-text-muted">
        Connect to view this user&apos;s posts
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="feed-card px-4 py-8 text-center text-xs text-text-muted">
        {emptyMessage ??
          (source === "saved"
            ? "No saved posts yet"
            : source === "profile"
              ? "No posts yet"
              : "No posts yet. Connect with peers or share an update.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item) => (
        <PostCard
          key={`${item.type}-${item.type === "repost" ? `${item.repostedByName}-` : ""}${item.post.id}`}
          item={item}
          currentUserId={currentUserId}
          onRefresh={load}
        />
      ))}
    </div>
  );
}
