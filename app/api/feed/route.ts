import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { requireDoctorSession } from "@/lib/feed-utils";
import { buildFeedItemsForAuthorIds } from "@/lib/feed-items";

export const dynamic = "force-dynamic";

/** Feed visible to all members who completed their profile (plus your own posts). */
export async function GET() {
  try {
    const session = await requireDoctorSession();
    const viewerId = session.user.id;

    const members = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isProfileComplete, true));

    const authorIds = members.map((m) => m.id);
    if (!authorIds.includes(viewerId)) {
      authorIds.push(viewerId);
    }

    const { items } = await buildFeedItemsForAuthorIds(authorIds, viewerId);

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_DOCTOR_ONLY") {
      return NextResponse.json(
        { error: "Complete your profile to view the feed" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
