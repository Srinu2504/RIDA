import { NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, posts } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await requireDoctorSession();
    const { postId, commentId } = params;
    const { content } = await req.json();

    if (!content || String(content).trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (String(content).length > 500) {
      return NextResponse.json({ error: "Max 500 characters" }, { status: 400 });
    }

    const [comment] = await db
      .select({ id: comments.id, authorId: comments.authorId })
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.postId, postId)))
      .limit(1);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(comments)
      .set({ content: String(content).trim(), updatedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning();

    return NextResponse.json({ comment: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await requireDoctorSession();
    const { postId, commentId } = params;

    const [comment] = await db
      .select({ id: comments.id, authorId: comments.authorId })
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.postId, postId)))
      .limit(1);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await db
      .delete(comments)
      .where(or(eq(comments.id, commentId), eq(comments.parentId, commentId)))
      .returning({ id: comments.id });

    await db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} - ${deleted.length}` })
      .where(eq(posts.id, postId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

