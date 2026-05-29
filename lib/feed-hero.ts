import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, doctorProfiles } from "@/drizzle/schema";
import type { HeroStripData } from "@/types";

export async function getFeedHeroData(
  userId: string,
  fullName: string
): Promise<HeroStripData> {
  const [profile] = await db
    .select({
      firstName: doctorProfiles.firstName,
      lastName: doctorProfiles.lastName,
      specialty: doctorProfiles.specialty,
      hospitalName: doctorProfiles.hospitalName,
      profilePhoto: doctorProfiles.profilePhoto,
    })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, userId))
    .limit(1);

  const rows = await db
    .select({
      status: connections.status,
      senderId: connections.senderId,
      receiverId: connections.receiverId,
    })
    .from(connections)
    .where(
      or(
        eq(connections.senderId, userId),
        eq(connections.receiverId, userId)
      )
    );

  const connectionRows = rows.filter((row) => row.status === "ACCEPTED");
  const pendingRows = rows.filter(
    (row) => row.status === "PENDING" && row.receiverId === userId
  );

  return {
    fullName,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    specialty: profile?.specialty,
    hospitalName: profile?.hospitalName ?? undefined,
    profilePhoto: profile?.profilePhoto,
    connections: connectionRows.length,
    pending: pendingRows.length,
  };
}
