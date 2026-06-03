"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  userId: string;
  fullName: string;
  profilePhoto?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserMenu({
  userId,
  fullName,
  profilePhoto,
  open,
  onOpenChange,
}: UserMenuProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const profileHref = userId ? `/profile/${userId}` : "/feed";

  useEffect(() => {
    onOpenChange(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex min-w-[52px] flex-col items-center gap-0.5 rounded px-1 py-1 sm:min-w-[64px]",
          open ? "text-text-dark" : "text-text-muted hover:text-text-dark"
        )}
      >
        <UserAvatar
          name={fullName}
          src={profilePhoto}
          size={28}
          className="!rounded-full border border-[#d6cec4]"
        />
        <span className="hidden items-center gap-0.5 text-[10px] font-medium sm:flex">
          Me
          <span className="text-[8px]">▾</span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-[60] w-48 overflow-hidden rounded-lg border border-[#e0e0e0] bg-white py-1 shadow-lg"
        >
          <Link
            href={profileHref}
            role="menuitem"
            className="block px-4 py-2.5 text-xs font-medium text-text-dark hover:bg-[#f3f2ef]"
            onClick={() => onOpenChange(false)}
          >
            View profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full border-t border-[#eee] px-4 py-2.5 text-left text-xs font-medium text-[#c0392b] hover:bg-[#f3f2ef]"
            onClick={() => {
              onOpenChange(false);
              signOut({ callbackUrl: "/signin" });
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
