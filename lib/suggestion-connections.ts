import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections } from "@/drizzle/schema";
import type { ConnectionStatus, DoctorSearchResult } from "@/types";

export async function attachConnectionStatus(
  viewerId: string,
  people: DoctorSearchResult[]
): Promise<DoctorSearchResult[]> {
  return Promise.all(
    people.map(async (person) => {
      const [conn] = await db
        .select({ status: connections.status })
        .from(connections)
        .where(
          or(
            and(
              eq(connections.senderId, viewerId),
              eq(connections.receiverId, person.userId)
            ),
            and(
              eq(connections.senderId, person.userId),
              eq(connections.receiverId, viewerId)
            )
          )
        )
        .limit(1);

      return {
        ...person,
        connectionStatus: (conn?.status as ConnectionStatus) ?? null,
      };
    })
  );
}
