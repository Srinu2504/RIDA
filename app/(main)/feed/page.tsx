import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { doctorProfiles, users } from "@/drizzle/schema";
import { eq, ne, and } from "drizzle-orm";
import { HeroStrip } from "@/components/shared/hero-strip";
import { FeedTabs } from "@/components/shared/feed-tabs";
import { PostComposer } from "@/components/feed/post-composer";
import { PostFeed } from "@/components/feed/post-card";
import { FeedSidebar } from "@/components/feed/feed-sidebar";
import type { DoctorSearchResult } from "@/types";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);

  const suggestions = await db
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
      session?.user?.id
        ? and(
            eq(users.isProfileComplete, true),
            ne(doctorProfiles.userId, session.user.id)
          )
        : eq(users.isProfileComplete, true)
    )
    .limit(6);

  return (
    <>
      <HeroStrip />
      <FeedTabs />
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3.5 px-4 py-3.5 md:px-[22px] lg:grid-cols-[1fr_200px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <PostComposer />
          <PostFeed />
        </div>
        <FeedSidebar
          suggestions={suggestions as DoctorSearchResult[]}
        />
      </div>
    </>
  );
}
