import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<Skeleton className="h-64 w-full max-w-md rounded-lg" />}
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
