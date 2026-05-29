"use client";

import { PostFeed } from "@/components/feed/post-card";
import { PageBackHeader } from "@/components/shared/page-back-header";

export function SavedPageClient({ currentUserId }: { currentUserId: string }) {
  return (
    <div className="mx-auto max-w-[680px] px-4 py-5 md:px-6">
      <PageBackHeader
        title="Saved posts"
        subtitle="Your bookmarked posts"
      />
      <PostFeed source="saved" currentUserId={currentUserId} />
    </div>
  );
}
