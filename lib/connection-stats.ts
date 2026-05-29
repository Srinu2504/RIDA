import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections } from "@/drizzle/schema";

export async function countAcceptedConnections(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(connections)
    .where(
      and(
        eq(connections.status, "ACCEPTED"),
        or(
          eq(connections.senderId, userId),
          eq(connections.receiverId, userId)
        )
      )
    );
  return Number(row?.count ?? 0);
}
