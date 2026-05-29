import { db } from "@/lib/db";
import { doctorProfiles, notifications, users } from "@/drizzle/schema";
import { pusherServer } from "@/lib/pusher";
import { and, eq } from "drizzle-orm";
import { getNotificationText } from "@/lib/notification-text";

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

