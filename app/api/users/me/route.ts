import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { canCreateDoctorProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        isProfileComplete: users.isProfileComplete,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profile = null;
    if (canCreateDoctorProfile(user.role)) {
      const [doctorProfile] = await db
        .select()
        .from(doctorProfiles)
        .where(eq(doctorProfiles.userId, userId))
        .limit(1);
      profile = doctorProfile ?? null;
    }

    return NextResponse.json({ user, profile });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
