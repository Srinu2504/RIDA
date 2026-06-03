import { db } from "@/lib/db";
import { doctorProfiles, notifications, users } from "@/drizzle/schema";
import { pusherServer } from "@/lib/pusher";
import { and, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { connections } from "@/drizzle/schema";
import { getNotificationText, isBellNotification } from "@/lib/notification-text";

type NotificationVisibilityInput = {
  type: string;
  connectionId?: string | null;
};

/** Connection requests stay in the badge/list only while still pending. */
export function isVisibleNotification(
  item: NotificationVisibilityInput,
  pendingConnectionIds: Set<string>
): boolean {
  if (!isBellNotification(item.type)) return false;
  if (item.type !== "connection_request" || !item.connectionId) return true;
  return pendingConnectionIds.has(item.connectionId);
}

export async function getPendingConnectionIds(
  connectionIds: string[]
): Promise<Set<string>> {
  if (connectionIds.length === 0) return new Set();

  const rows = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        inArray(connections.id, connectionIds),
        eq(connections.status, "PENDING")
      )
    );

  return new Set(rows.map((r) => r.id));
}

/** Unread alerts for handled/missing connection requests should not inflate the badge. */
export async function markStaleConnectionRequestNotificationsAsRead(
  recipientId: string
) {
  const stale = await db
    .select({ id: notifications.id })
    .from(notifications)
    .leftJoin(connections, eq(connections.id, notifications.connectionId))
    .where(
      and(
        eq(notifications.recipientId, recipientId),
        eq(notifications.type, "connection_request"),
        eq(notifications.isRead, false),
        or(
          isNull(notifications.connectionId),
          isNull(connections.id),
          ne(connections.status, "PENDING")
        )
      )
    );

  if (stale.length === 0) return;

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      inArray(
        notifications.id,
        stale.map((row) => row.id)
      )
    );
}

/** Message alerts use messaging unread counts, not the notifications bell. */
export async function markMessageNotificationsAsRead(recipientId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.recipientId, recipientId),
        eq(notifications.type, "message"),
        eq(notifications.isRead, false)
      )
    );
}

export async function countVisibleUnreadNotifications(
  recipientId: string
): Promise<number> {
  await markStaleConnectionRequestNotificationsAsRead(recipientId);
  await markMessageNotificationsAsRead(recipientId);

  const unread = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      connectionId: notifications.connectionId,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, recipientId),
        eq(notifications.isRead, false)
      )
    );

  const requestIds = unread
    .filter((n) => n.type === "connection_request" && n.connectionId)
    .map((n) => n.connectionId as string);

  const pendingConnectionIds = await getPendingConnectionIds(requestIds);

  return unread.filter((item) =>
    isVisibleNotification(item, pendingConnectionIds)
  ).length;
}

interface CreateNotificationParams {
  recipientId: string;
  actorId: string;
  type: string;
  postId?: string;
  commentId?: string;
  conversationId?: string;
  connectionId?: string;
}

/** Mark connection-request alerts as read once the request is handled. */
export async function dismissConnectionRequestNotifications(
  connectionId: string,
  recipientId: string
) {
  const updated = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.connectionId, connectionId),
        eq(notifications.recipientId, recipientId),
        eq(notifications.type, "connection_request")
      )
    )
    .returning({ id: notifications.id });

  if (updated.length === 0) return;

  try {
    await pusherServer.trigger(`user-${recipientId}`, "notifications-read", {
      notificationId: "connection-handled",
      connectionId,
    });
  } catch (err) {
    console.error("[dismissConnectionRequestNotifications] Pusher failed:", err);
  }
}

export async function createNotification(params: CreateNotificationParams) {
  if (params.recipientId === params.actorId) return null;

  const [notification] = await db
    .insert(notifications)
    .values({
      recipientId: params.recipientId,
      actorId: params.actorId,
      type: params.type,
      message: params.type,
      postId: params.postId,
      commentId: params.commentId,
      conversationId: params.conversationId,
      connectionId: params.connectionId,
    })
    .returning();

  const [actor] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      avatar: doctorProfiles.profilePhoto,
      specialty: doctorProfiles.specialty,
    })
    .from(users)
    .leftJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
    .where(eq(users.id, params.actorId))
    .limit(1);

  try {
    await pusherServer.trigger(`user-${params.recipientId}`, "new-notification", {
      notification: {
        ...notification,
        actor: actor
          ? {
              id: actor.id,
              name: actor.fullName,
              avatar: actor.avatar,
              specialty: actor.specialty,
            }
          : null,
        text: getNotificationText(params.type, actor?.fullName ?? "Someone"),
      },
    });
  } catch (err) {
    console.error("[createNotification] Pusher trigger failed:", err);
  }

  return notification;
}

