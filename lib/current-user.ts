import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles } from "@/drizzle/schema";
import { getSession } from "@/lib/session";
import type { AppUser } from "@/components/shared/user-context";

export async function getAppUser(): Promise<AppUser | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const [profile] = await db
    .select({ profilePhoto: doctorProfiles.profilePhoto })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, session.user.id))
    .limit(1);

  return {
    id: session.user.id,
    fullName: session.user.fullName,
    profilePhoto: profile?.profilePhoto ?? null,
  };
}
