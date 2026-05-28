import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { pusherServer } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { conversationId, isTyping } = await req.json();
    if (!conversationId || typeof isTyping !== "boolean") {
      return NextResponse.json(
        { error: "conversationId and isTyping are required" },
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

    await pusherServer.trigger(`conversation-${conversationId}`, "typing", {
      userId,
      isTyping,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

