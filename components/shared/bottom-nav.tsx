"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/shared/user-context";
import {
  IconBell,
  IconHome,
  IconSearch,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/connections", label: "Network", icon: IconUsers },
  { href: "/notifications", label: "Alerts", icon: IconBell },
];

export function BottomNav() {
  const pathname = usePathname();
  const user = useUser();
  const profileHref = user ? `/profile/${user.id}` : "/feed";

  const allTabs = [
    ...tabs,
    { href: profileHref, label: "Me", icon: IconUser },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d6cec4] bg-white md:hidden">
      <div className="flex justify-around py-1.5">
        {allTabs.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href.startsWith("/profile") && pathname.startsWith("/profile"));
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1",
                active ? "text-text-dark" : "text-text-muted"
              )}
            >
              <Icon size={22} stroke={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
