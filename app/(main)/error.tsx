"use client";

import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <h2 className="text-lg font-extrabold text-text-dark">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-xs text-text-muted">{error.message}</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
