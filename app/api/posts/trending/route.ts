import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, posts, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const TRENDING_TAGS = ["Photo", "Article", "Case Study"] as const;

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "10", 10) || 10,
      50
    );

    const rows = await db
      .select({
        id: posts.id,
        tag: posts.tag,
        body: posts.body,
        imageUrl: posts.imageUrl,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        authorName: users.fullName,
        firstName: doctorProfiles.firstName,
        lastName: doctorProfiles.lastName,
      })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, posts.authorId))
      .where(
        and(
          eq(users.isProfileComplete, true),
          inArray(posts.tag, [...TRENDING_TAGS])
        )
      )
      .orderBy(
        desc(sql`(${posts.likeCount} + ${posts.commentCount})`),
        desc(posts.createdAt)
      )
      .limit(limit);

    return NextResponse.json({ posts: rows });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
