import { and, eq, or } from "drizzle-orm";
import { connections } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function requireDoctorSession() {
  const session = await requireSession();
  if (session.user.role !== "DOCTOR") {
    throw new Error("FORBIDDEN_DOCTOR_ONLY");
  }
  return session;
}

export async function areConnectedDoctors(a: string, b: string) {
  const [row] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.status, "ACCEPTED"),
        or(
          and(eq(connections.senderId, a), eq(connections.receiverId, b)),
          and(eq(connections.senderId, b), eq(connections.receiverId, a))
        )
      )
    )
    .limit(1);
  return !!row;
}

