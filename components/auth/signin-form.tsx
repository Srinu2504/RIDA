"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { signinSchema } from "@/lib/validations";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBackLink } from "@/components/auth/auth-back-link";

type SigninForm = z.infer<typeof signinSchema>;

export function SigninForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninForm) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error
        );
        return;
      }

      toast.success("Welcome back!");
      router.push("/feed");
      router.refresh();
    } catch {
      toast.error("Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <AuthBackLink href="/" label="Home" />
      <h1 className="mb-6 text-center text-[22px] font-extrabold text-green-primary">
        RIDA
      </h1>
      <div className="rounded-2xl border-[0.5px] border-cream-border bg-cream-surface p-8">
        <h2 className="mb-1 text-base font-extrabold text-text-dark">
          Sign in
        </h2>
        <p className="mb-6 text-[11px] text-text-muted">
          Email and password only — no OTP at login
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button
            type="submit"
            className="mt-2 h-11 w-full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-[11px] text-text-muted">
            New to RIDA?{" "}
            <Link
              href="/signup"
              className="font-semibold text-green-primary hover:underline"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
