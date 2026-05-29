import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { otpTokens, users } from "@/drizzle/schema";
import { verifyOTP } from "@/lib/otp";
import { verifyOtpSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 3;

function getRoleRedirect(role: string) {
  switch (role) {
    case "MEDICAL_STUDENT":
      return "/setup-profile/student";
    case "PRACTICING_PHYSICIAN":
      return "/setup-profile/physician";
    case "RETIRED_PHYSICIAN":
      return "/setup-profile/retired";
    default:
      return "/setup-profile/physician";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid OTP format" },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const [token] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, normalizedEmail),
          gt(otpTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!token) {
      return NextResponse.json(
        { error: "OTP expired or not found. Please sign up again." },
        { status: 400 }
      );
    }

    if (token.attempts >= MAX_ATTEMPTS) {
      await db.delete(otpTokens).where(eq(otpTokens.id, token.id));
      return NextResponse.json(
        { error: "Too many attempts. Please sign up again." },
        { status: 429 }
      );
    }

    const valid = await verifyOTP(otp, token.otpHash);

    if (!valid) {
      await db
        .update(otpTokens)
        .set({ attempts: token.attempts + 1 })
        .where(eq(otpTokens.id, token.id));

      return NextResponse.json(
        {
          error: "Invalid verification code",
          attemptsLeft: MAX_ATTEMPTS - token.attempts - 1,
        },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      await db.delete(otpTokens).where(eq(otpTokens.id, token.id));
      return NextResponse.json(
        { error: "Account already exists. Please sign in." },
        { status: 409 }
      );
    }

    await db.insert(users).values({
      email: normalizedEmail,
      password: token.passwordHash,
      fullName: token.fullName,
      role: token.role,
      isEmailVerified: true,
      isProfileComplete: false,
    });

    await db.delete(otpTokens).where(eq(otpTokens.id, token.id));

    return NextResponse.json({
      message: "Email verified. You can now sign in.",
      redirectTo: getRoleRedirect(token.role),
    });
  } catch (error) {
    console.error("[verify-otp]", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
