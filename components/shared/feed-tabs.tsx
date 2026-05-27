"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", label: "Feed" },
  { href: "/search", label: "Discover" },
  { href: "/connections", label: "My network" },
  { href: "/notifications", label: "Alerts" },
];

export function FeedTabs() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const profileHref = session?.user
    ? `/profile/${session.user.id}`
    : "/feed";

  const allTabs = [...tabs, { href: profileHref, label: "Profile" }];

  return (
    <div className="hidden border-b-[0.5px] border-cream-border bg-cream-surface md:block">
      <div className="mx-auto flex max-w-[1200px] gap-0 px-6">
        {allTabs.map(({ href, label }) => {
          const active =
            pathname === href ||
            (label === "Profile" && pathname.startsWith("/profile"));
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "border-b-2 px-4 py-3 text-xs font-semibold transition-colors",
                active
                  ? "border-green-primary text-green-primary"
                  : "border-transparent text-text-muted hover:text-text-mid"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
