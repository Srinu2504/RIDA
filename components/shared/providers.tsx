"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#faf6ef",
            color: "#3a3028",
            border: "0.5px solid #e0d8c8",
            fontSize: "12px",
            boxShadow: "none",
          },
        }}
      />
      <SonnerToaster
        richColors={false}
        toastOptions={{
          style: {
            background: "#faf6ef",
            color: "#3a3028",
            border: "0.5px solid #e0d8c8",
            fontSize: "12px",
            boxShadow: "none",
          },
        }}
      />
    </SessionProvider>
  );
}
