import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, doctorProfiles, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const rows = await db
      .select({
        id: connections.id,
        status: connections.status,
        createdAt: connections.createdAt,
        senderId: connections.senderId,
        receiverId: connections.receiverId,
        senderName: users.fullName,
      })
      .from(connections)
      .innerJoin(users, eq(users.id, connections.senderId))
      .where(
        or(
          eq(connections.senderId, userId),
          eq(connections.receiverId, userId)
        )
      );

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const otherId =
          row.senderId === userId ? row.receiverId : row.senderId;

        const [otherUser] = await db
          .select({ id: users.id, fullName: users.fullName, role: users.role })
          .from(users)
          .where(eq(users.id, otherId))
          .limit(1);

        const [profile] = await db
          .select({
            firstName: doctorProfiles.firstName,
            lastName: doctorProfiles.lastName,
            profilePhoto: doctorProfiles.profilePhoto,
            specialty: doctorProfiles.specialty,
          })
          .from(doctorProfiles)
          .where(eq(doctorProfiles.userId, otherId))
          .limit(1);

        return {
          ...row,
          direction: row.senderId === userId ? "sent" : "received",
          otherUser,
          profile,
        };
      })
    );

    return NextResponse.json({ connections: enriched });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const senderId = session.user.id;
    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: "receiverId is required" },
        { status: 400 }
      );
    }

    if (receiverId === senderId) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    const [receiver] = await db
      .select({ id: users.id, role: users.role, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

  if (receiver.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "You can only connect with doctors" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.senderId, senderId),
            eq(connections.receiverId, receiverId)
          ),
          and(
            eq(connections.senderId, receiverId),
            eq(connections.receiverId, senderId)
          )
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists", status: existing.status },
        { status: 409 }
      );
    }

    const [connection] = await db
      .insert(connections)
      .values({ senderId, receiverId, status: "PENDING" })
      .returning();

    await createNotification({
      recipientId: receiverId,
      actorId: senderId,
      type: "connection_request",
      connectionId: connection.id,
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error("[connections POST]", error);
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 }
    );
  }
}
