import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  doctorProfiles,
  likes,
  posts,
  reposts,
  saves,
  users,
} from "@/drizzle/schema";

export async function buildFeedItemsForAuthorIds(
  authorIds: string[],
  viewerId: string
) {
  if (authorIds.length === 0) {
    return { items: [] };
  }

  const postRows = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      tag: posts.tag,
      body: posts.body,
      imageUrl: posts.imageUrl,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      saveCount: posts.saveCount,
      repostCount: posts.repostCount,
      createdAt: posts.createdAt,
      authorName: users.fullName,
      profilePhoto: doctorProfiles.profilePhoto,
      specialty: doctorProfiles.specialty,
      hospitalName: doctorProfiles.hospitalName,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(doctorProfiles, eq(doctorProfiles.userId, posts.authorId))
    .where(inArray(posts.authorId, authorIds))
    .orderBy(desc(posts.createdAt));

  const repostRows = await db
    .select({
      id: reposts.id,
      doctorId: reposts.doctorId,
      originalPostId: reposts.originalPostId,
      createdAt: reposts.createdAt,
      doctorName: users.fullName,
    })
    .from(reposts)
    .innerJoin(users, eq(users.id, reposts.doctorId))
    .where(inArray(reposts.doctorId, authorIds))
    .orderBy(desc(reposts.createdAt));

  const likesByMe = await db
    .select({ postId: likes.postId })
    .from(likes)
    .where(eq(likes.doctorId, viewerId));
  const savesByMe = await db
    .select({ postId: saves.postId })
    .from(saves)
    .where(eq(saves.doctorId, viewerId));

  const likedSet = new Set(likesByMe.map((x) => x.postId));
  const savedSet = new Set(savesByMe.map((x) => x.postId));
  const postsMap = new Map(postRows.map((p) => [p.id, p]));

  const items = [
    ...postRows.map((p) => ({
      type: "post" as const,
      sortAt: p.createdAt ?? new Date(0),
      post: {
        ...p,
        liked: likedSet.has(p.id),
        saved: savedSet.has(p.id),
      },
    })),
    ...repostRows
      .map((r) => {
        const original = postsMap.get(r.originalPostId);
        if (!original) return null;
        return {
          type: "repost" as const,
          sortAt: r.createdAt ?? new Date(0),
          repostedByName: r.doctorName,
          repostedById: r.doctorId,
          post: {
            ...original,
            liked: likedSet.has(original.id),
            saved: savedSet.has(original.id),
          },
        };
      })
      .filter(Boolean),
  ].sort((a, b) => +new Date(b?.sortAt ?? 0) - +new Date(a?.sortAt ?? 0));

  return { items };
}
