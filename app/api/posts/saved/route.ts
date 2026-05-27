import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, posts, saves, users } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";

export async function GET() {
  try {
    const session = await requireDoctorSession();
    const userId = session.user.id;

    const rows = await db
      .select({
        savedAt: saves.createdAt,
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
      .from(saves)
      .innerJoin(posts, eq(posts.id, saves.postId))
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, posts.authorId))
      .where(eq(saves.doctorId, userId))
      .orderBy(desc(saves.createdAt));

    return NextResponse.json({
      items: rows.map((r) => ({
        type: "post",
        sortAt: r.savedAt ?? r.createdAt,
        post: {
          id: r.id,
          authorId: r.authorId,
          tag: r.tag,
          body: r.body,
          imageUrl: r.imageUrl,
          likeCount: r.likeCount,
          commentCount: r.commentCount,
          saveCount: r.saveCount,
          repostCount: r.repostCount,
          createdAt: r.createdAt,
          authorName: r.authorName,
          profilePhoto: r.profilePhoto,
          specialty: r.specialty,
          hospitalName: r.hospitalName,
          liked: false,
          saved: true,
        },
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json({ error: "Doctors only" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

