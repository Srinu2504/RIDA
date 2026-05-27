"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/shared/user-avatar";

interface ProfileInfo {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  hospitalName?: string;
  profilePhoto?: string | null;
}

export function HeroStrip() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [connections, setConnections] = useState(0);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    Promise.all([
      fetch("/api/users/me").then((r) => r.json()),
      fetch("/api/connections").then((r) => r.json()),
    ]).then(([me, conn]) => {
      if (me.profile) setProfile(me.profile);
      const list = conn.connections ?? [];
      setConnections(
        list.filter((c: { status: string }) => c.status === "ACCEPTED").length
      );
      setPending(
        list.filter(
          (c: { status: string; direction: string }) =>
            c.status === "PENDING" && c.direction === "received"
        ).length
      );
    });
  }, [session]);

  const name =
    profile?.firstName && profile?.lastName
      ? `Dr. ${profile.firstName} ${profile.lastName}`
      : session?.user?.fullName ?? "Doctor";

  const subtitle = [profile?.specialty, profile?.hospitalName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-b-[0.5px] border-[#e5ddd0] bg-cream-surface px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={name}
            src={profile?.profilePhoto}
            size={50}
            square
          />
          <div>
            <h1 className="text-base font-extrabold text-text-dark">{name}</h1>
            {subtitle && (
              <p className="text-[11px] text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex gap-6 md:gap-10">
          <Stat value={connections} label="Connections" />
          <Stat value={pending} label="Pending" />
          <Stat value="—" label="Views" />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold text-green-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
    </div>
  );
}
