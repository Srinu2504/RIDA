"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { IconMail } from "@tabler/icons-react";
import { useSignupStore } from "@/lib/stores/signup-store";
import { Button } from "@/components/ui/button";
import { AuthBackLink } from "@/components/auth/auth-back-link";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeEmail = useSignupStore((s) => s.email);
  const clearSignup = useSignupStore((s) => s.clear);
  const email = searchParams.get("email") ?? storeEmail;
  const [loading, setLoading] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        return;
      }

      clearSignup();
      toast.success("Email verified! Please sign in.");
      router.push("/signin");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <p className="text-xs text-text-muted">
          No email found. Please{" "}
          <Link href="/signup" className="font-semibold text-green-primary">
            sign up
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <AuthBackLink href="/signup" label="Back" />
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-light">
          <IconMail size={32} className="text-green-primary" stroke={1.5} />
        </div>
        <h1 className="text-lg font-extrabold text-text-dark">
          Check your email
        </h1>
        <p className="mt-2 text-center text-[11px] text-text-muted">
          We sent a 6-digit code to{" "}
          <strong className="text-text-mid">{email}</strong>
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-3 rounded-lg bg-green-pale px-3 py-2 text-[10px] text-green-muted">
            Dev: check terminal for <code>[RIDA DEV] OTP</code>
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-[52px] w-11 rounded-lg border-[0.5px] border-[#d8d0c0] bg-cream-input text-center text-lg font-bold text-text-dark focus:border-green-primary focus:outline-none"
            />
          ))}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? "Verifying…" : "Verify email"}
        </Button>

        <p className="text-center text-[11px] text-text-muted">
          Didn&apos;t receive it?{" "}
          <Link
            href="/signup"
            className="font-semibold text-green-primary hover:underline"
          >
            Resend code
          </Link>
        </p>
      </form>
    </div>
  );
}
