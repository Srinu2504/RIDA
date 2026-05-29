"use client";

import { SessionProvider } from "next-auth/react";

export function OnboardingSession({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
