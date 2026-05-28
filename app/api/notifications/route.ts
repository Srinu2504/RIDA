import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, notifications, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { getNotificationIcon, getNotificationLink, getNotificationText } from "@/lib/notification-text";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const offset = (page - 1) * limit;

    const items = await db
      .select({
        id: notifications.id,
        recipientId: notifications.recipientId,
        actorId: notifications.actorId,
        type: notifications.type,
        postId: notifications.postId,
        commentId: notifications.commentId,
        conversationId: notifications.conversationId,
        connectionId: notifications.connectionId,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
        actorName: users.fullName,
        actorAvatar: doctorProfiles.profilePhoto,
        actorSpecialty: doctorProfiles.specialty,
      })
      .from(notifications)
      .innerJoin(users, eq(users.id, notifications.actorId))
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, notifications.actorId))
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const unreadCountRow = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.recipientId, userId), eq(notifications.isRead, false)));

    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    return NextResponse.json({
      notifications: pageItems.map((item) => ({
        ...item,
        actor: {
          id: item.actorId,
          name: item.actorName,
          avatar: item.actorAvatar,
          specialty: item.actorSpecialty,
        },
        text: getNotificationText(item.type, item.actorName),
        icon: getNotificationIcon(item.type),
        link: getNotificationLink(item),
      })),
      unreadCount: unreadCountRow[0]?.count ?? 0,
      hasMore,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
