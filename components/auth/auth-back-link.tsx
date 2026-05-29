"use client";

import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export function AuthBackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-green-primary transition-colors hover:bg-green-pale"
    >
      <IconArrowLeft size={18} stroke={2} />
      {label}
    </Link>
  );
}
