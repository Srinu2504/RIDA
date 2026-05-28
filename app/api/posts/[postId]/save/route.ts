import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, saves } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";

export const dynamic = "force-dynamic";

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
      .select({ id: saves.id })
      .from(saves)
      .where(and(eq(saves.postId, postId), eq(saves.doctorId, userId)))
      .limit(1);

    let saved = false;
    if (existing) {
      await db.delete(saves).where(eq(saves.id, existing.id));
      await db.update(posts).set({ saveCount: sql`${posts.saveCount} - 1` }).where(eq(posts.id, postId));
      saved = false;
    } else {
      await db.insert(saves).values({ postId, doctorId: userId });
      await db.update(posts).set({ saveCount: sql`${posts.saveCount} + 1` }).where(eq(posts.id, postId));
      saved = true;
    }

    return NextResponse.json({ saved });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

