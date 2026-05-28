import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorProfiles, users } from "@/drizzle/schema";
import { requireSession } from "@/lib/session";
import { doctorProfileSchema, formatZodErrors } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    if (session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can create a profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = doctorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const userId = session.user.id;

    const [existing] = await db
      .select({ id: doctorProfiles.id })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);

    const profileValues = {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      profilePhoto: data.profilePhoto || null,
      bio: data.bio || null,
      gender: data.gender,
      medicalLicenseNo: data.medicalLicenseNo,
      specialty: data.specialty,
      subSpecialty: data.subSpecialty || null,
      yearsOfExperience: data.yearsOfExperience,
      qualification: data.qualification,
      additionalDegrees: data.additionalDegrees || null,
      hospitalName: data.hospitalName || null,
      clinicName: data.clinicName || null,
      city: data.city,
      state: data.state,
      country: data.country,
      consultationFee: data.consultationFee ?? null,
      phone: data.phone || null,
      website: data.website || null,
      profileVisibility: data.profileVisibility,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(doctorProfiles)
        .set(profileValues)
        .where(eq(doctorProfiles.userId, userId));
    } else {
      await db.insert(doctorProfiles).values(profileValues);
    }

    await db
      .update(users)
      .set({ isProfileComplete: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ message: "Profile saved" });
  } catch (error) {
    console.error("[profile]", error);

    const pgCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";

    if (pgCode === "23505") {
      return NextResponse.json(
        { error: "Medical license number already registered" },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
