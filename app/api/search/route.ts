import { NextResponse } from "next/server";
import { and, eq, gte, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, doctorProfiles, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const viewerId = session.user.id;
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") ?? "";
    const specialty = searchParams.get("specialty");
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    const minExperience = searchParams.get("minExperience");
    const gender = searchParams.get("gender");

    const conditions = [
      inArray(users.role, ["PRACTICING_PHYSICIAN", "RETIRED_PHYSICIAN"]),
      eq(users.isProfileComplete, true),
    ];

    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(doctorProfiles.firstName, pattern),
          ilike(doctorProfiles.lastName, pattern),
          ilike(doctorProfiles.specialty, pattern),
          ilike(doctorProfiles.hospitalName, pattern),
          ilike(doctorProfiles.city, pattern)
        )!
      );
    }

    if (specialty) {
      conditions.push(eq(doctorProfiles.specialty, specialty));
    }
    if (city) {
      conditions.push(ilike(doctorProfiles.city, `%${city}%`));
    }
    if (country) {
      conditions.push(ilike(doctorProfiles.country, `%${country}%`));
    }
    if (minExperience) {
      conditions.push(
        gte(doctorProfiles.yearsOfExperience, parseInt(minExperience, 10))
      );
    }
    if (gender) {
      conditions.push(eq(doctorProfiles.gender, gender));
    }

    const results = await db
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
      .where(and(...conditions))
      .limit(50);

    const withConnections = await Promise.all(
      results.map(async (doctor) => {
        if (doctor.userId === viewerId) {
          return { ...doctor, connectionStatus: null };
        }

        const [conn] = await db
          .select({ status: connections.status, senderId: connections.senderId })
          .from(connections)
          .where(
            or(
              and(
                eq(connections.senderId, viewerId),
                eq(connections.receiverId, doctor.userId)
              ),
              and(
                eq(connections.senderId, doctor.userId),
                eq(connections.receiverId, viewerId)
              )
            )
          )
          .limit(1);

        return {
          ...doctor,
          connectionStatus: conn?.status ?? null,
        };
      })
    );

    return NextResponse.json({ doctors: withConnections });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
