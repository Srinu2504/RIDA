import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { likes, posts } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  _req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireDoctorSession();
    const userId = session.user.id;
    const { postId } = params;

    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [existing] = await db
      .select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.doctorId, userId)))
      .limit(1);

    let liked = false;
    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      await db
        .update(posts)
        .set({ likeCount: sql`${posts.likeCount} - 1` })
        .where(eq(posts.id, postId));
      liked = false;
    } else {
      await db.insert(likes).values({ postId, doctorId: userId });
      await db
        .update(posts)
        .set({ likeCount: sql`${posts.likeCount} + 1` })
        .where(eq(posts.id, postId));
      liked = true;
    }

    const [fresh] = await db
      .select({ likeCount: posts.likeCount })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    const likeCount = Number(fresh?.likeCount ?? 0);
    await pusherServer.trigger(`post-${postId}`, "like-updated", {
      likeCount,
      likedBy: userId,
      action: liked ? "liked" : "unliked",
    });

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

