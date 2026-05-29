"use client";

import Link from "next/link";
import Image from "next/image";
import type { DoctorSearchResult } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatProfileName } from "@/lib/user-display";
import { RoleLabel } from "@/components/shared/role-label";
import { cn } from "@/lib/utils";

interface DoctorCardProps {
  doctor: DoctorSearchResult;
  onConnect?: (userId: string) => void;
  loading?: boolean;
  grid?: boolean;
}

export function DoctorCard({
  doctor,
  onConnect,
  loading,
  grid = true,
}: DoctorCardProps) {
  const name = formatProfileName(
    doctor.role ?? "PRACTICING_PHYSICIAN",
    doctor.firstName,
    doctor.lastName
  );
  const status = doctor.connectionStatus;

  if (grid) {
    return (
      <div className="rida-card flex flex-col items-center p-4 text-center">
        <div className="mb-3">
          {doctor.profilePhoto ? (
            <div className="relative h-[46px] w-[46px] overflow-hidden rounded-full">
              <Image
                src={doctor.profilePhoto}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <UserAvatar
              name={doctor.firstName}
              size={46}
            />
          )}
        </div>
        <Link
          href={`/profile/${doctor.userId}`}
          className="text-xs font-bold text-text-dark hover:text-green-primary"
        >
          {name}
        </Link>
        <RoleLabel role={doctor.role} className="mt-0.5" />
        <p className="mt-0.5 text-[10px] font-bold text-green-primary">
          {doctor.specialty}
        </p>
        <p className="mt-1 text-[10px] text-text-muted">
          {doctor.role === "MEDICAL_STUDENT"
            ? [doctor.university ?? doctor.hospitalName, doctor.college, doctor.city]
                .filter(Boolean)
                .join(" · ")
            : [doctor.hospitalName, doctor.city].filter(Boolean).join(" · ")}
        </p>
        {onConnect && (
          <button
            type="button"
            disabled={
              loading || status === "PENDING" || status === "ACCEPTED"
            }
            onClick={() => onConnect(doctor.userId)}
            className={cn(
              "mt-3 w-full rounded-lg border-[1.5px] border-green-primary py-2 text-xs font-semibold text-green-primary",
              "transition-colors hover:bg-green-pale disabled:opacity-50"
            )}
          >
            {status === "PENDING"
              ? "Pending"
              : status === "ACCEPTED"
                ? "Connected"
                : "+ Connect"}
          </button>
        )}
      </div>
    );
  }

  return null;
}
