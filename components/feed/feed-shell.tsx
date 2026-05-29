"use client";

import { Suspense, useCallback, useState } from "react";
import { PostComposer } from "@/components/feed/post-composer";
import { PostFeed } from "@/components/feed/post-card";
import { FeedSidebar } from "@/components/feed/feed-sidebar";
import { FeedProfileSidebar } from "@/components/feed/feed-profile-sidebar";
import type { DoctorSearchResult, HeroStripData } from "@/types";

interface FeedShellProps {
  currentUserId: string;
  hero: HeroStripData | null;
  suggestions: DoctorSearchResult[];
}

export function FeedShell({
  currentUserId,
  hero,
  suggestions,
}: FeedShellProps) {
  const [feedKey, setFeedKey] = useState(0);
  const refreshFeed = useCallback(() => setFeedKey((k) => k + 1), []);

  return (
    <div className="mx-auto w-full max-w-[1128px] px-3 py-4 md:px-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[225px_minmax(0,1fr)_300px] lg:gap-4">
        {hero && currentUserId ? (
          <FeedProfileSidebar data={hero} userId={currentUserId} />
        ) : (
          <div className="hidden lg:block" />
        )}

        <main className="mx-auto flex w-full min-w-0 max-w-[560px] flex-col gap-2 lg:max-w-none">
          <PostComposer onPosted={refreshFeed} />
          <Suspense
            fallback={
              <p className="feed-card px-4 py-8 text-center text-xs text-text-muted">
                Loading feed…
              </p>
            }
          >
            <PostFeed
              key={feedKey}
              currentUserId={currentUserId}
              source="feed"
            />
          </Suspense>
        </main>

        <FeedSidebar suggestions={suggestions} feedRefreshKey={feedKey} />
      </div>
    </div>
  );
}
