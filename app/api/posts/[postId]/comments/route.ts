import { NextResponse } from "next/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, doctorProfiles, posts, users } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";
import { pusherServer } from "@/lib/pusher";

export async function GET(
  _req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    await requireDoctorSession();
    const { postId } = params;

    const top = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.fullName,
        avatar: doctorProfiles.profilePhoto,
        specialty: doctorProfiles.specialty,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, comments.authorId))
      .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));

    const replies = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.fullName,
        avatar: doctorProfiles.profilePhoto,
        specialty: doctorProfiles.specialty,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, comments.authorId))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    const byParent = new Map<string, typeof replies>();
    for (const r of replies) {
      if (!r.parentId) continue;
      const list = byParent.get(r.parentId) ?? [];
      list.push(r);
      byParent.set(r.parentId, list);
    }

    return NextResponse.json({
      comments: top.map((c) => ({
        ...c,
        replies: byParent.get(c.id) ?? [],
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireDoctorSession();
    const { postId } = params;
    const { content, parentId } = await req.json();

    if (!content || String(content).trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (String(content).length > 500) {
      return NextResponse.json({ error: "Max 500 characters" }, { status: 400 });
    }

    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [created] = await db
      .insert(comments)
      .values({
        postId,
        authorId: session.user.id,
        content: String(content).trim(),
        parentId: parentId ?? null,
      })
      .returning();

    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));

    const [fullComment] = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        content: comments.content,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorName: users.fullName,
        avatar: doctorProfiles.profilePhoto,
        specialty: doctorProfiles.specialty,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, comments.authorId))
      .where(eq(comments.id, created.id))
      .limit(1);

    await pusherServer.trigger(`post-${postId}`, "new-comment", {
      comment: fullComment,
    });

    return NextResponse.json({ comment: fullComment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

