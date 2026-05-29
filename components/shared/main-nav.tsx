"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/components/shared/user-context";
import {
  IconBookmark,
  IconHome,
  IconMessage,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { UserMenu } from "@/components/shared/user-menu";
import { useMessagingStore } from "@/lib/stores/messaging-store";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Home", icon: IconHome },
  { href: "/connections", label: "My Network", icon: IconUsers },
  { href: "/messages", label: "Messaging", icon: IconMessage },
];

export function MainNav() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const totalUnread = useMessagingStore((s) => s.totalUnread);
  const setWidgetOpen = useMessagingStore((s) => s.setWidgetOpen);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const {
    unreadCount: notifUnread,
    notifications,
    setNotifications,
    setUnreadCount,
  } = useNotifications(user?.id ?? "");

  useEffect(() => {
    if (!showNotifDropdown || !user?.id) return;
    fetch("/api/notifications?page=1&limit=5")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
      })
      .catch(() => {});
  }, [showNotifDropdown, user?.id, setNotifications, setUnreadCount]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d6cec4] bg-white">
      <div className="mx-auto flex h-[52px] max-w-[1128px] items-center gap-2 px-3 md:gap-4 md:px-4">
        <Link
          href="/feed"
          className="flex shrink-0 items-center gap-1"
          aria-label="RIDA home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded bg-green-primary text-sm font-black text-white">
            R
          </span>
          <span className="hidden text-lg font-black tracking-wide text-green-primary sm:inline">
            RIDA
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block md:max-w-[280px]">
          <div className="relative">
            <IconSearch
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              stroke={1.5}
            />
            <input
              type="search"
              placeholder="Search"
              className="h-[34px] w-full rounded-md border border-[#d6cec4] bg-[#eef3f8] pl-9 pr-3 text-xs text-text-dark placeholder:text-text-muted focus:border-green-primary focus:bg-white focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value;
                  router.push(
                    q ? `/search?q=${encodeURIComponent(q)}` : "/search"
                  );
                }
              }}
            />
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const badge = href === "/messages" ? totalUnread : 0;
            const isMessaging = href === "/messages";

            if (isMessaging) {
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => setWidgetOpen(true)}
                  className={cn(
                    "relative flex min-w-[52px] flex-col items-center gap-0.5 rounded px-1 py-1 transition-colors hover:text-text-dark sm:min-w-[64px]",
                    active || totalUnread > 0
                      ? "text-text-dark"
                      : "text-text-muted"
                  )}
                  aria-label="Open messaging"
                >
                  <Icon size={20} stroke={active ? 2 : 1.5} />
                  {badge > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-primary px-0.5 text-[9px] font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  <span className="hidden text-[10px] font-medium sm:block">
                    {label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex min-w-[52px] flex-col items-center gap-0.5 rounded px-1 py-1 transition-colors hover:text-text-dark sm:min-w-[64px]",
                  active ? "text-text-dark" : "text-text-muted"
                )}
              >
                <Icon size={20} stroke={active ? 2 : 1.5} />
                <span
                  className={cn(
                    "hidden text-[10px] font-medium sm:block",
                    active && "font-semibold text-text-dark"
                  )}
                >
                  {label}
                </span>
                {active && (
                  <span className="absolute -bottom-[9px] left-1 right-1 hidden h-[2px] rounded-full bg-text-dark sm:block" />
                )}
              </Link>
            );
          })}

          <Link
            href="/search"
            className={cn(
              "flex min-w-[52px] flex-col items-center gap-0.5 rounded px-1 py-1 sm:min-w-[64px] md:hidden",
              pathname === "/search" ? "text-text-dark" : "text-text-muted"
            )}
          >
            <IconSearch size={20} stroke={1.5} />
            <span className="text-[10px] font-medium">Search</span>
          </Link>

          <div className="relative">
            <button
              type="button"
              className={cn(
                "relative flex min-w-[52px] flex-col items-center gap-0.5 rounded px-1 py-1 text-text-muted hover:text-text-dark sm:min-w-[64px]",
                pathname === "/notifications" && "text-text-dark"
              )}
              aria-label="Notifications"
              onClick={() => {
                setShowUserMenu(false);
                setShowNotifDropdown((x) => !x);
              }}
            >
              <Bell size={20} />
              {notifUnread > 0 && (
                <span className="absolute right-1 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0392b] px-0.5 text-[9px] font-bold text-white">
                  {notifUnread > 99 ? "99+" : notifUnread}
                </span>
              )}
              <span className="hidden text-[10px] font-medium sm:block">
                Notifications
              </span>
            </button>
            <NotificationDropdown
              open={showNotifDropdown}
              onClose={() => setShowNotifDropdown(false)}
              notifications={notifications}
              onMarkedRead={(id) => {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }}
              onDismissed={(id) => {
                setNotifications((prev) => {
                  const target = prev.find((n) => n.id === id);
                  if (target && !target.isRead) {
                    setUnreadCount((c) => Math.max(0, c - 1));
                  }
                  return prev.filter((n) => n.id !== id);
                });
              }}
              onMarkAllRead={() => {
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                );
                setUnreadCount(0);
              }}
            />
          </div>

          <Link
            href="/saved"
            className="hidden min-w-[52px] flex-col items-center gap-0.5 rounded px-1 py-1 text-text-muted hover:text-text-dark lg:flex"
          >
            <IconBookmark size={20} stroke={1.5} />
            <span className="text-[10px] font-medium">Saved</span>
          </Link>

          {user && (
            <UserMenu
              userId={user.id}
              fullName={user.fullName}
              profilePhoto={user.profilePhoto}
              open={showUserMenu}
              onOpenChange={(open) => {
                if (open) setShowNotifDropdown(false);
                setShowUserMenu(open);
              }}
            />
          )}
        </nav>
      </div>
    </header>
  );
}
