"use client";

import Link from "next/link";
import Image from "next/image";
import {
  IconBookmark,
  IconChevronRight,
  IconUsers,
} from "@tabler/icons-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatProfileName } from "@/lib/user-display";
import { RoleLabel } from "@/components/shared/role-label";
import type { HeroStripData } from "@/types";

export function FeedProfileSidebar({
  data,
  userId,
}: {
  data: HeroStripData;
  userId: string;
}) {
  const name =
    data.firstName && data.lastName && data.role
      ? formatProfileName(data.role, data.firstName, data.lastName)
      : data.fullName;

  const subtitle =
    data.role === "MEDICAL_STUDENT"
      ? [data.specialty, data.university]
          .filter(Boolean)
          .join(" · ")
      : [data.specialty, data.hospitalName].filter(Boolean).join(" · ");

  const location = [data.city, data.country].filter(Boolean).join(", ");

  const institution =
    data.role === "MEDICAL_STUDENT"
      ? data.college ?? data.university
      : data.hospitalName;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-[225px]">
      <div className="feed-card">
        <Link href={`/profile/${userId}`} className="block">
          <div className="h-14 bg-gradient-to-r from-green-primary to-[#40916c]" />
          <div className="px-3 pb-3">
            <div className="-mt-9 mb-2">
              {data.profilePhoto ? (
                <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white bg-white">
                  <Image
                    src={data.profilePhoto}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-full border-[3px] border-white bg-white">
                  <UserAvatar name={name} size={72} />
                </div>
              )}
            </div>
            <h2 className="text-sm font-bold leading-tight text-text-dark hover:text-green-primary hover:underline">
              {name}
            </h2>
            <RoleLabel role={data.role} className="mt-1 text-[11px]" />
            {data.specialty && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-mid">
                {data.specialty}
              </p>
            )}
            {subtitle && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-muted">
                {subtitle}
              </p>
            )}
            {location && (
              <p className="mt-1 text-[10px] text-text-muted">{location}</p>
            )}
            {institution && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-text-mid">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-green-pale text-[8px] text-green-primary">
                  R
                </span>
                <span className="truncate">{institution}</span>
              </p>
            )}
          </div>
        </Link>
        <div className="border-t border-[#ebe6dc] px-3 py-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted">Connections</span>
            <span className="font-bold text-green-primary hover:underline">
              <Link href="/connections">{data.connections}</Link>
            </span>
          </div>
          {data.pending > 0 && (
            <div className="mt-1 flex justify-between text-[11px]">
              <span className="text-text-muted">Pending invites</span>
              <span className="font-bold text-green-primary hover:underline">
                <Link href="/connections">{data.pending}</Link>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="feed-card py-1">
        <SidebarLink href="/connections" icon={IconUsers} label="My network" />
        <SidebarLink href="/saved" icon={IconBookmark} label="Saved posts" />
        <SidebarLink href={`/profile/${userId}`} label="View full profile" showChevron />
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  showChevron,
}: {
  href: string;
  icon?: typeof IconUsers;
  label: string;
  showChevron?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-text-mid transition-colors hover:bg-[#f8f6f1]"
    >
      {Icon && (
        <Icon size={18} stroke={1.5} className="shrink-0 text-text-muted" />
      )}
      <span className="flex-1">{label}</span>
      {showChevron && (
        <IconChevronRight size={14} className="text-text-faint" stroke={1.5} />
      )}
    </Link>
  );
}
