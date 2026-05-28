import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!convo) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const allowed =
      convo.doctorOneId === userId || convo.doctorTwoId === userId;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    await db
      .update(messages)
      .set({ isRead: true, readAt: now })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isRead, false),
          ne(messages.senderId, userId)
        )
      );

    await pusherServer.trigger(`conversation-${conversationId}`, "messages-read", {
      readBy: userId,
    });

    const otherId = convo.doctorOneId === userId ? convo.doctorTwoId : convo.doctorOneId;
    await pusherServer.trigger(`user-${otherId}`, "unread-update", {
      conversationId,
    });

    await pusherServer.trigger(`user-${userId}`, "unread-update", {
      conversationId,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

