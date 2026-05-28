import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { conversationId } = params;

    const url = new URL(req.url);
    const offsetParam = url.searchParams.get("offset");
    const offset = Math.max(0, Number(offsetParam ?? 0) || 0);

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

    const page = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(50)
      .offset(offset);

    return NextResponse.json({ messages: page });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

