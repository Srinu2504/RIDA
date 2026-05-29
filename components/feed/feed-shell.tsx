"use client";

import { FeedTabs } from "@/components/shared/feed-tabs";
import { PostComposer } from "@/components/feed/post-composer";
import { PostFeed } from "@/components/feed/post-card";
import { FeedSidebar } from "@/components/feed/feed-sidebar";
import type { DoctorSearchResult } from "@/types";

interface FeedShellProps {
  currentUserId: string;
  suggestions: DoctorSearchResult[];
}

export function FeedShell({ currentUserId, suggestions }: FeedShellProps) {
  return (
    <>
      <FeedTabs />
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3.5 px-4 py-3.5 md:px-[22px] lg:grid-cols-[1fr_200px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <PostComposer />
          <PostFeed currentUserId={currentUserId} />
        </div>
        <FeedSidebar suggestions={suggestions} />
      </div>
    </>
  );
}
