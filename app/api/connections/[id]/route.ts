import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { connectionActionSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const connectionId = params.id;

    if (!connectionId) {
      return NextResponse.json({ error: "Connection id required" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = connectionActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { status } = parsed.data;

    const [connection] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (connection.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the recipient can accept or decline this request" },
        { status: 403 }
      );
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "Connection is not pending" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(connections)
      .set({ status, updatedAt: new Date() })
      .where(eq(connections.id, connectionId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
    }

    if (status === "ACCEPTED") {
      try {
        await createNotification({
          recipientId: connection.senderId,
          actorId: session.user.id,
          type: "connection_accepted",
          connectionId: connection.id,
        });
      } catch (err) {
        console.error("[connections PATCH] notification failed:", err);
      }
    }

    return NextResponse.json({ connection: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[connections PATCH]", error);
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}
