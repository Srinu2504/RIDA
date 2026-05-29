import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";
import { createPostSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireDoctorSession();
    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { body: text, tag, imageUrl } = parsed.data;
    const trimmedBody =
      parsed.data.tag === "Photo"
        ? text.trim() || "Shared a photo"
        : text.trim();

    const [created] = await db
      .insert(posts)
      .values({
        authorId: session.user.id,
        tag,
        body: trimmedBody,
        imageUrl: imageUrl?.trim() || null,
      })
      .returning();

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json(
        { error: "Complete your profile to post" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
