import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { connectionActionSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

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

    if (status === "ACCEPTED") {
      await createNotification({
        recipientId: connection.senderId,
        actorId: session.user.id,
        type: "connection_accepted",
        connectionId: connection.id,
      });
    }

    return NextResponse.json({ connection: { ...connection, status } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
