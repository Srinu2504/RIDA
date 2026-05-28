import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, reposts } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireDoctorSession();
    const userId = session.user.id;
    const { postId } = params;
    const { type } = await req.json();

    const [post] = await db
      .select({ id: posts.id, authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (type === "copy-link") {
      return NextResponse.json({ url: `/posts/${postId}` });
    }

    if (type !== "repost") {
      return NextResponse.json({ error: "Invalid share type" }, { status: 400 });
    }

    if (post.authorId === userId) {
      return NextResponse.json(
        { error: "You can only repost others' posts" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: reposts.id })
      .from(reposts)
      .where(and(eq(reposts.originalPostId, postId), eq(reposts.doctorId, userId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ reposted: true });
    }

    await db.insert(reposts).values({ originalPostId: postId, doctorId: userId });
    await db
      .update(posts)
      .set({ repostCount: sql`${posts.repostCount} + 1` })
      .where(eq(posts.id, postId));
    await createNotification({
      recipientId: post.authorId,
      actorId: userId,
      type: "repost",
      postId,
    });

    return NextResponse.json({ reposted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

