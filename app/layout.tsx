import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "RIDA — Doctors Social Network",
  description: "Professional social media platform for doctors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
