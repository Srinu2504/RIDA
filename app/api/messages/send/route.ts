import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { pusherServer } from "@/lib/pusher";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { conversationId, content } = await req.json();
    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      );
    }

    if (String(content).length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
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

    const [msg] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        content: content.trim(),
        isRead: false,
      })
      .returning();

    await db
      .update(conversations)
      .set({ lastMessageAt: msg.createdAt })
      .where(eq(conversations.id, conversationId));

    await pusherServer.trigger(`conversation-${conversationId}`, "new-message", {
      message: msg,
    });

    const otherId = convo.doctorOneId === userId ? convo.doctorTwoId : convo.doctorOneId;
    await pusherServer.trigger(`user-${otherId}`, "unread-update", {
      conversationId,
    });
    return NextResponse.json({ message: msg });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

