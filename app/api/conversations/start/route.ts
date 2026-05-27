import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, conversations } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";

function orderedPair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { targetDoctorId } = await req.json();

    if (!targetDoctorId) {
      return NextResponse.json(
        { error: "targetDoctorId is required" },
        { status: 400 }
      );
    }

    if (targetDoctorId === userId) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    const [one, two] = orderedPair(userId, targetDoctorId);

    const [connected] = await db
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

    if (!connected) {
      return NextResponse.json({ error: "Not connected" }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(eq(conversations.doctorOneId, one), eq(conversations.doctorTwoId, two))
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    const [created] = await db
      .insert(conversations)
      .values({ doctorOneId: one, doctorTwoId: two })
      .returning({ id: conversations.id });

    return NextResponse.json({ conversationId: created.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

