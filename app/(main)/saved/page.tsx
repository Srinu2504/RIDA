import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PostFeed } from "@/components/feed/post-card";

export default async function SavedPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-[22px]">
      <div className="mb-3">
        <h1 className="text-sm font-extrabold text-text-dark">Saved posts</h1>
        <p className="text-xs text-text-muted">Your bookmarked posts</p>
      </div>
      <PostFeed source="saved" currentUserId={session?.user?.id ?? ""} />
    </div>
  );
}
