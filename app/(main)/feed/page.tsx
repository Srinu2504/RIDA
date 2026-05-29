import { eq, ne, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, users } from "@/drizzle/schema";
import { HeroStrip } from "@/components/shared/hero-strip";
import { FeedShell } from "@/components/feed/feed-shell";
import { getFeedHeroData } from "@/lib/feed-hero";
import { getSession } from "@/lib/session";
import type { DoctorSearchResult } from "@/types";

export default async function FeedPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const [hero, suggestions] = await Promise.all([
    userId
      ? getFeedHeroData(userId, session.user.fullName)
      : Promise.resolve(null),
    db
      .select({
        userId: doctorProfiles.userId,
        firstName: doctorProfiles.firstName,
        lastName: doctorProfiles.lastName,
        profilePhoto: doctorProfiles.profilePhoto,
        specialty: doctorProfiles.specialty,
        hospitalName: doctorProfiles.hospitalName,
        city: doctorProfiles.city,
        country: doctorProfiles.country,
        yearsOfExperience: doctorProfiles.yearsOfExperience,
        gender: doctorProfiles.gender,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(users.id, doctorProfiles.userId))
      .where(
        userId
          ? and(
              eq(users.isProfileComplete, true),
              ne(doctorProfiles.userId, userId)
            )
          : eq(users.isProfileComplete, true)
      )
      .limit(6),
  ]);

  return (
    <>
      {hero && <HeroStrip data={hero} />}
      <FeedShell
        currentUserId={userId ?? ""}
        suggestions={suggestions as DoctorSearchResult[]}
      />
    </>
  );
}
