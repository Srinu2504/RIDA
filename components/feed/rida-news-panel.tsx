"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { TrendingPost } from "@/types";
import {
  formatPostEngagement,
  relativeTimeShort,
  truncatePostPreview,
  trendingTagLabel,
} from "@/lib/post-display";

const SIDEBAR_LIMIT = 4;

interface RidaNewsPanelProps {
  refreshKey?: number;
  compact?: boolean;
}

export function RidaNewsPanel({ refreshKey = 0, compact = true }: RidaNewsPanelProps) {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const limit = compact ? SIDEBAR_LIMIT : 30;
      const res = await fetch(`/api/posts/trending?limit=${limit}`);
      const json = await res.json();
      if (res.ok) setPosts(json.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const list = compact ? posts.slice(0, SIDEBAR_LIMIT) : posts;

  return (
    <div className="feed-card overflow-hidden">
      <div className="border-b border-[#ebe6dc] px-3 py-2.5">
        <h3 className="text-sm font-bold text-text-dark">RIDA News</h3>
        <p className="text-[10px] text-text-muted">
          Top photos, articles & case studies by engagement
        </p>
      </div>

      {loading ? (
        <ul className="px-3 py-4">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="mb-3 h-12 animate-pulse rounded bg-[#f0ebe3]"
            />
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-text-muted">
          No trending posts yet. Share a photo, article, or case study.
        </p>
      ) : (
        <ul>
          {list.map((post, i) => {
            const engagement = formatPostEngagement(
              post.likeCount ?? 0,
              post.commentCount ?? 0
            );
            const when = post.createdAt
              ? relativeTimeShort(post.createdAt)
              : "";

            return (
              <li key={post.id}>
                <Link
                  href={`/feed?post=${post.id}`}
                  className="block px-3 py-2.5 transition-colors hover:bg-[#f8f6f1]"
                >
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-green-primary">
                      {trendingTagLabel(post.tag)}
                    </span>
                    <span className="text-[9px] text-text-faint">· {when}</span>
                  </div>
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-text-dark">
                    {truncatePostPreview(post.body)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-text-muted">{engagement}</p>
                </Link>
                {i < list.length - 1 && (
                  <div className="mx-3 border-t border-[#ebe6dc]" />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {compact && !loading && posts.length > 0 && (
        <Link
          href="/trending"
          className="block border-t border-[#ebe6dc] px-3 py-2 text-center text-xs font-semibold text-green-primary hover:bg-[#f8f6f1]"
        >
          Show more
        </Link>
      )}
    </div>
  );
}
