import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { otpTokens, users } from "@/drizzle/schema";
import { generateOTP, hashOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/resend";
import { signupSchema } from "@/lib/validations";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, fullName, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    await db.delete(otpTokens).where(eq(otpTokens.email, normalizedEmail));

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otpTokens).values({
      email: normalizedEmail,
      otpHash,
      passwordHash,
      fullName,
      role,
      expiresAt,
    });

    const emailResult = await sendOTPEmail(normalizedEmail, otp);

    if (!emailResult.success) {
      if (isDev) {
        return NextResponse.json({
          message:
            "Email could not be sent (see warning). Use the dev code below or check the terminal.",
          email: normalizedEmail,
          devOtp: otp,
          emailWarning: emailResult.error,
        });
      }

      await db.delete(otpTokens).where(eq(otpTokens.email, normalizedEmail));

      return NextResponse.json(
        { error: emailResult.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent",
      email: normalizedEmail,
      ...(isDev ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("[send-otp]", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
