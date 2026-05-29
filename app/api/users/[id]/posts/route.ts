import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, doctorProfiles, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { buildFeedItemsForAuthorIds } from "@/lib/feed-items";
import { canCreateDoctorProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const viewerId = session.user.id;
    const targetId = params.id;

    const [targetUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);

    if (!targetUser || !canCreateDoctorProfile(targetUser.role)) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const [profile] = await db
      .select({ profileVisibility: doctorProfiles.profileVisibility })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, targetId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isSelf = viewerId === targetId;
    let isConnected = false;

    if (!isSelf) {
      const [conn] = await db
        .select({ id: connections.id })
        .from(connections)
        .where(
          and(
            or(
              and(
                eq(connections.senderId, viewerId),
                eq(connections.receiverId, targetId)
              ),
              and(
                eq(connections.senderId, targetId),
                eq(connections.receiverId, viewerId)
              )
            ),
            eq(connections.status, "ACCEPTED")
          )
        )
        .limit(1);
      isConnected = !!conn;
    }

    const canViewPosts =
      isSelf ||
      profile.profileVisibility === "PUBLIC" ||
      (profile.profileVisibility === "CONNECTIONS_ONLY" && isConnected);

    if (!canViewPosts) {
      return NextResponse.json({ items: [], locked: true });
    }

    const { items } = await buildFeedItemsForAuthorIds([targetId], viewerId);
    return NextResponse.json({ items, locked: false });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
