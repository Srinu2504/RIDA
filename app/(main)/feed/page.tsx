import { eq, ne, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, users } from "@/drizzle/schema";
import { FeedShell } from "@/components/feed/feed-shell";
import { getFeedHeroData } from "@/lib/feed-hero";
import { attachConnectionStatus } from "@/lib/suggestion-connections";
import { getSession } from "@/lib/session";
import type { DoctorSearchResult } from "@/types";

export default async function FeedPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const rawSuggestions = await db
    .select({
      userId: doctorProfiles.userId,
      role: users.role,
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
    .limit(8);

  const [hero, suggestions] = await Promise.all([
    userId
      ? getFeedHeroData(userId, session.user.fullName, session.user.role)
      : Promise.resolve(null),
    userId
      ? attachConnectionStatus(userId, rawSuggestions as DoctorSearchResult[])
      : Promise.resolve(rawSuggestions as DoctorSearchResult[]),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      <FeedShell
        currentUserId={userId ?? ""}
        hero={hero}
        suggestions={suggestions as DoctorSearchResult[]}
      />
    </div>
  );
}
