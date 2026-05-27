import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, notifications, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { connectionActionSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = connectionActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { status } = parsed.data;

    const [connection] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, params.id))
      .limit(1);

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (connection.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "Connection is not pending" },
        { status: 400 }
      );
    }

    await db
      .update(connections)
      .set({ status, updatedAt: new Date() })
      .where(eq(connections.id, params.id));

    const type =
      status === "ACCEPTED" ? "CONNECTION_ACCEPTED" : "CONNECTION_REJECTED";
    const message =
      status === "ACCEPTED"
        ? `${session.user.fullName} accepted your connection request`
        : `${session.user.fullName} declined your connection request`;

    await db.insert(notifications).values({
      userId: connection.senderId,
      type,
      message,
      relatedUserId: session.user.id,
      connectionId: connection.id,
    });

    return NextResponse.json({ connection: { ...connection, status } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
