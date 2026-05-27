"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  IconBell,
  IconBookmark,
  IconMessage,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { pusherClient } from "@/lib/pusher";

export function MainNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const load = async () => {
      const res = await fetch("/api/conversations");
      const json = await res.json();
      if (res.ok) setUnread(Number(json.totalUnread ?? 0));
    };

    load().catch(() => {});

    const channel = pusherClient.subscribe(`user-${userId}`);
    channel.bind("unread-update", () => load().catch(() => {}));

    return () => {
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [session?.user?.id]);

  return (
    <header className="sticky top-0 z-50 h-14 bg-green-primary">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-4 px-4 md:px-6">
        <Link
          href="/feed"
          className="shrink-0 text-xl font-black tracking-[4px] text-cream-surface"
        >
          RIDA
        </Link>

        <div className="hidden flex-1 md:block">
          <div className="relative mx-auto max-w-md">
            <IconSearch
              className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/60"
              stroke={1.5}
            />
            <input
              type="search"
              placeholder="Search doctors, specialties…"
              className="h-9 w-full rounded-lg border-0 bg-[rgba(247,244,238,0.15)] pl-10 pr-4 text-xs text-cream-surface placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value;
                  router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
                }
              }}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/messages"
            className="relative text-white/80 transition-colors hover:text-white"
            aria-label="Messages"
          >
            <IconMessage size={19} stroke={1.5} />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-cream-surface px-1 text-[10px] font-extrabold text-green-primary">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/saved"
            className="relative text-white/80 transition-colors hover:text-white"
            aria-label="Saved posts"
          >
            <IconBookmark size={19} stroke={1.5} />
          </Link>
          <Link
            href="/connections"
            className="relative text-white/80 transition-colors hover:text-white"
            aria-label="Network"
          >
            <IconUsers size={19} stroke={1.5} />
            <span className="rida-notif-dot" />
          </Link>
          <Link
            href="/notifications"
            className="relative text-white/80 transition-colors hover:text-white"
            aria-label="Alerts"
          >
            <IconBell size={19} stroke={1.5} />
            <span className="rida-notif-dot" />
          </Link>
          {session?.user && (
            <Link href={`/profile/${session.user.id}`}>
              <UserAvatar
                name={session.user.fullName}
                size={32}
                square
                className="!rounded-lg !bg-cream-surface !text-green-primary"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
