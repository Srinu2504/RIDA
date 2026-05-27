import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json({ notifications: items });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
