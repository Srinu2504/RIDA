import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, notifications, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { getNotificationIcon, getNotificationLink, getNotificationText } from "@/lib/notification-text";
import {
  countVisibleUnreadNotifications,
  getPendingConnectionIds,
  isVisibleNotification,
  markMessageNotificationsAsRead,
  markStaleConnectionRequestNotificationsAsRead,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

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
      .where(
        and(
          eq(notifications.recipientId, userId),
          ne(notifications.type, "message")
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1)
      .offset(offset);

    await markStaleConnectionRequestNotificationsAsRead(userId);
    await markMessageNotificationsAsRead(userId);

    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;

    const requestConnectionIds = pageItems
      .filter((i) => i.type === "connection_request" && i.connectionId)
      .map((i) => i.connectionId as string);

    const pendingConnectionIds = await getPendingConnectionIds(
      requestConnectionIds
    );

    const visibleItems = pageItems.filter((item) =>
      isVisibleNotification(item, pendingConnectionIds)
    );

    const unreadCount = await countVisibleUnreadNotifications(userId);

    return NextResponse.json({
      notifications: visibleItems.map((item) => ({
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
      unreadCount,
      hasMore,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
