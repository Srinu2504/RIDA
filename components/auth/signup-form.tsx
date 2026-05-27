"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { signupSchema } from "@/lib/validations";
import type { z } from "zod";
import { useSignupStore } from "@/lib/stores/signup-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SignupForm = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const setSignupData = useSignupStore((s) => s.setSignupData);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "DOCTOR" },
  });

  const role = watch("role");

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(
          typeof json.error === "string" ? json.error : "Signup failed"
        );
        return;
      }

      setSignupData({
        email: json.email,
        fullName: data.fullName,
        role: data.role,
      });

      if (json.emailWarning) {
        toast.error(json.emailWarning, { duration: 8000 });
      }

      if (json.devOtp) {
        toast.success(`Dev mode — your code is ${json.devOtp}`, {
          duration: 15000,
        });
      } else {
        toast.success("Verification code sent to your email");
      }

      router.push(`/verify-email?email=${encodeURIComponent(json.email)}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <h1 className="mb-6 text-center text-[22px] font-extrabold text-green-primary">
        RIDA
      </h1>
      <div className="rounded-2xl border-[0.5px] border-cream-border bg-cream-surface p-8">
        <h2 className="mb-1 text-base font-extrabold text-text-dark">
          Create account
        </h2>
        <p className="mb-6 text-[11px] text-text-muted">
          Join the professional network for doctors
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" className="mt-1" {...register("fullName")} />
            {errors.fullName && (
              <p className="mt-1 text-[10px] text-[#c0392b]">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-[10px] text-[#c0392b]">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label>I am a</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["DOCTOR", "PATIENT"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue("role", r)}
                  className={cn(
                    "rounded-lg py-3 text-xs font-semibold transition-colors",
                    role === r
                      ? "bg-green-primary text-cream-surface"
                      : "border-[0.5px] border-cream-border bg-cream-input text-text-mid hover:bg-green-pale"
                  )}
                >
                  {r === "DOCTOR" ? "Doctor" : "Patient / Other"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              className="mt-1"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-[10px] text-[#c0392b]">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="mt-1"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-[10px] text-[#c0392b]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="mt-2 h-11 w-full"
            disabled={loading}
          >
            {loading ? "Sending code…" : "Continue"}
          </Button>
          <p className="text-center text-[11px] text-text-muted">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-green-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
