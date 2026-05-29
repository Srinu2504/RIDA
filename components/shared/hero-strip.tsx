"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import { formatProfileName, formatRoleLabel } from "@/lib/user-display";
import type { HeroStripData } from "@/types";

export function HeroStrip({ data }: { data: HeroStripData }) {
  const name =
    data.firstName && data.lastName && data.role
      ? formatProfileName(data.role, data.firstName, data.lastName)
      : data.fullName;

  const subtitle =
    data.role === "MEDICAL_STUDENT"
      ? [data.specialty, data.university, data.college]
          .filter(Boolean)
          .join(" · ")
      : [data.specialty, data.hospitalName].filter(Boolean).join(" · ");

  return (
    <div className="border-b-[0.5px] border-[#e5ddd0] bg-cream-surface px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={name}
            src={data.profilePhoto}
            size={50}
            square
          />
          <div>
            <h1 className="text-base font-extrabold text-text-dark">{name}</h1>
            {data.role === "MEDICAL_STUDENT" && (
              <p className="text-[11px] font-semibold text-text-muted">
                {formatRoleLabel(data.role)}
              </p>
            )}
            {subtitle && (
              <p className="text-[11px] text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex gap-6 md:gap-10">
          <Stat value={data.connections} label="Connections" />
          <Stat value={data.pending} label="Pending" />
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
