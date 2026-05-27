import { NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, conversations, doctorProfiles, messages } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";

function pairKey(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const convos = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.doctorOneId, userId), eq(conversations.doctorTwoId, userId)))
      .orderBy(desc(conversations.lastMessageAt));

    const enriched = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.doctorOneId === userId ? c.doctorTwoId : c.doctorOneId;
        const [one, two] = pairKey(userId, otherId);

        const [isConnected] = await db
          .select({ id: connections.id })
          .from(connections)
          .where(
            and(
              eq(connections.status, "ACCEPTED"),
              or(
                and(eq(connections.senderId, one), eq(connections.receiverId, two)),
                and(eq(connections.senderId, two), eq(connections.receiverId, one))
              )
            )
          )
          .limit(1);

        if (!isConnected) return null;

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

        const [last] = await db
          .select({
            content: messages.content,
            createdAt: messages.createdAt,
            senderId: messages.senderId,
            isRead: messages.isRead,
          })
          .from(messages)
          .where(eq(messages.conversationId, c.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const [unread] = await db
          .select({
            count: sql<number>`count(*)`.mapWith(Number),
          })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, c.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} <> ${userId}`
            )
          );

        const otherName = profile
          ? `Dr. ${profile.firstName} ${profile.lastName}`
          : "Doctor";

        return {
          id: c.id,
          doctorOneId: c.doctorOneId,
          doctorTwoId: c.doctorTwoId,
          lastMessageAt: c.lastMessageAt,
          createdAt: c.createdAt,
          otherDoctor: {
            id: otherId,
            name: otherName,
            avatar: profile?.profilePhoto ?? null,
            specialty: profile?.specialty ?? "",
          },
          lastMessagePreview: last?.content ?? "",
          lastMessageCreatedAt: last?.createdAt ?? null,
          unreadCount: unread?.count ?? 0,
        };
      })
    );

    const items = enriched.filter(Boolean) as NonNullable<(typeof enriched)[number]>[];
    const totalUnread = items.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

    return NextResponse.json({ conversations: items, totalUnread });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

