import { Resend } from "resend";

export type SendEmailResult =
  | { success: true; id?: string }
  | { success: false; error: string };

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<SendEmailResult> {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log(`[RIDA DEV] OTP for ${email}: ${otp}`);
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      error:
        "RESEND_API_KEY is not set. Check your .env file and restart the dev server.",
    };
  }

  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend client could not be initialized." };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "RIDA <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: "Your RIDA verification code",
    html: `
      <h2>Welcome to RIDA</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 8px; font-size: 36px;">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you did not sign up for RIDA, ignore this email.</p>
    `,
  });

  if (error) {
    console.error("[RIDA] Resend error:", error);

    const message =
      error.message ??
      "Email could not be sent. With the test sender (onboarding@resend.dev), Resend only delivers to the email address on your Resend account. Verify a domain at resend.com/domains to send to any address.";

    return { success: false, error: message };
  }

  return { success: true, id: data?.id };
}
