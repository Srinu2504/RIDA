import { NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  connections,
  doctorProfiles,
  posts,
  users,
} from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { countAcceptedConnections } from "@/lib/connection-stats";
import { canCreateDoctorProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const targetId = params.id;
    const viewerId = session.user.id;

    const [targetUser] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
        isProfileComplete: users.isProfileComplete,
      })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);

    if (!targetUser || !canCreateDoctorProfile(targetUser.role)) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, targetId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not available" },
        { status: 404 }
      );
    }

    const isSelf = viewerId === targetId;
    let isConnected = false;

    if (!isSelf) {
      const [conn] = await db
        .select()
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

    const visibility = profile.profileVisibility;
    const canViewFull =
      isSelf ||
      visibility === "PUBLIC" ||
      (visibility === "CONNECTIONS_ONLY" && isConnected);

    const connectionCount = await countAcceptedConnections(targetId);

    const [postCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.authorId, targetId));
    const postCount = Number(postCountRow?.count ?? 0);

    if (!canViewFull) {
      return NextResponse.json({
        user: {
          id: targetUser.id,
          fullName: targetUser.fullName,
          role: targetUser.role,
        },
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePhoto: profile.profilePhoto,
          specialty: profile.specialty,
          city: profile.city,
          country: profile.country,
          hospitalName: profile.hospitalName,
          limited: true,
        },
        connectionCount,
        postCount,
      });
    }

    let connectionStatus = null;
    if (!isSelf) {
      const [conn] = await db
        .select({ status: connections.status })
        .from(connections)
        .where(
          or(
            and(
              eq(connections.senderId, viewerId),
              eq(connections.receiverId, targetId)
            ),
            and(
              eq(connections.senderId, targetId),
              eq(connections.receiverId, viewerId)
            )
          )
        )
        .limit(1);
      connectionStatus = conn?.status ?? null;
    }

    return NextResponse.json({
      user: targetUser,
      profile: { ...profile, limited: false },
      connectionStatus,
      connectionCount,
      postCount,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
