import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const notificationId = body?.notificationId as string | undefined;

    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.recipientId, userId)
          )
        );
      await pusherServer.trigger(`user-${userId}`, "notifications-read", {
        notificationId,
      });
      return NextResponse.json({ ok: true });
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.recipientId, userId));

    await pusherServer.trigger(`user-${userId}`, "notifications-read", {
      notificationId: "all",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

