import { NextResponse } from "next/server";
import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  connections,
  doctorProfiles,
  likes,
  posts,
  reposts,
  saves,
  users,
} from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";

export async function GET() {
  try {
    const session = await requireDoctorSession();
    const userId = session.user.id;

    const connectedRows = await db
      .select({ senderId: connections.senderId, receiverId: connections.receiverId })
      .from(connections)
      .where(eq(connections.status, "ACCEPTED"));

    const connectedIds = new Set<string>([userId]);
    for (const row of connectedRows) {
      if (row.senderId === userId) connectedIds.add(row.receiverId);
      if (row.receiverId === userId) connectedIds.add(row.senderId);
    }
    const audience = Array.from(connectedIds);

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
      .where(inArray(posts.authorId, audience))
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
      .where(inArray(reposts.doctorId, audience))
      .orderBy(desc(reposts.createdAt));

    const likesByMe = await db
      .select({ postId: likes.postId })
      .from(likes)
      .where(eq(likes.doctorId, userId));
    const savesByMe = await db
      .select({ postId: saves.postId })
      .from(saves)
      .where(eq(saves.doctorId, userId));

    const likedSet = new Set(likesByMe.map((x) => x.postId));
    const savedSet = new Set(savesByMe.map((x) => x.postId));
    const postsMap = new Map(postRows.map((p) => [p.id, p]));

    const feedItems = [
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
    ].sort((a, b) => +new Date(b.sortAt) - +new Date(a.sortAt));

    return NextResponse.json({ items: feedItems });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

