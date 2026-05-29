"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/shared/user-context";
import toast from "react-hot-toast";
import {
  IconAward,
  IconLock,
  IconMapPin,
  IconPhone,
  IconWorld,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorProfile {
  firstName: string;
  lastName: string;
  profilePhoto?: string | null;
  bio?: string | null;
  specialty: string;
  qualification?: string;
  additionalDegrees?: string | null;
  city?: string;
  state?: string;
  country?: string;
  hospitalName?: string | null;
  clinicName?: string | null;
  yearsOfExperience?: number;
  phone?: string | null;
  website?: string | null;
  medicalLicenseNo?: string;
  limited?: boolean;
}

interface ProfileData {
  user: { id: string; fullName: string; role: string };
  profile: DoctorProfile;
  connectionStatus?: string | null;
}

export function DoctorProfileView({ userId }: { userId: string }) {
  const user = useUser();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const json = await res.json();
        if (res.ok) setData(json);
        else toast.error(json.error ?? "Profile not found");
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed");
        return;
      }
      toast.success("Request sent");
      setData((d) =>
        d ? { ...d, connectionStatus: "PENDING" } : d
      );
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!data) {
    return (
      <p className="py-12 text-center text-xs text-text-muted">
        Profile not found
      </p>
    );
  }

  const { profile } = data;
  const limited = profile.limited;
  const name = `Dr. ${profile.firstName} ${profile.lastName}`;
  const isSelf = user?.id === userId;
  const isConnected = data.connectionStatus === "ACCEPTED";
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-[680px] px-4 py-0 md:px-0">
      <div className="h-[120px] bg-green-light" />

      <div className="rida-card relative -mt-8 px-5 pb-5 pt-0">
        <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
          <div className="flex gap-4">
            <div className="-mt-10">
              {profile.profilePhoto ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border-[0.5px] border-cream-border">
                  <Image
                    src={profile.profilePhoto}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <UserAvatar name={profile.firstName} size={64} square />
              )}
            </div>
            <div className="pt-1">
              <h1 className="text-lg font-extrabold text-text-dark">{name}</h1>
              <p className="text-[13px] font-bold text-green-primary">
                {profile.specialty}
                {profile.qualification ? ` · ${profile.qualification}` : ""}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <IconMapPin size={14} stroke={1.5} />
                {[profile.hospitalName, location].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {!isSelf && !limited && (
            <div className="flex items-center gap-2">
              <Button
                variant={isConnected ? "cream" : "outline"}
                disabled={connecting || data.connectionStatus === "PENDING" || isConnected}
                onClick={handleConnect}
              >
                {isConnected
                  ? "Connected"
                  : data.connectionStatus === "PENDING"
                    ? "Pending"
                    : "Connect"}
              </Button>

              <Button
                variant="cream"
                title={
                  isConnected
                    ? ""
                    : "Connect with this doctor to message them"
                }
                disabled={!isConnected}
                onClick={async () => {
                  try {
                    const res = await fetch("/api/conversations/start", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ targetDoctorId: userId }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      toast.error(
                        json.error ?? "Connect with this doctor to message them"
                      );
                      return;
                    }
                    router.push(`/messages?conversation=${json.conversationId}`);
                  } catch {
                    toast.error("Failed to start conversation");
                  }
                }}
              >
                Message
              </Button>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-around border-t-[0.5px] border-cream-divider pt-4">
          <ProfileStat label="Posts" value="0" />
          <ProfileStat label="Connections" value="—" />
          <ProfileStat label="Profile views" value="—" />
        </div>
      </div>

      {limited && (
        <div className="rida-card mt-3.5 flex items-center gap-2 p-4 text-xs text-text-muted">
          <IconLock size={16} stroke={1.5} className="text-green-muted" />
          Connect to view full profile details
        </div>
      )}

      {profile.bio && !limited && (
        <InfoCard title="About">
          <p className="text-xs leading-relaxed text-text-mid">{profile.bio}</p>
        </InfoCard>
      )}

      {!limited && (
        <>
          <InfoCard title="Professional details">
            <InfoRow label="Qualification" value={profile.qualification} />
            {profile.additionalDegrees && (
              <InfoRow
                label="Additional degrees"
                value={profile.additionalDegrees}
              />
            )}
            {profile.yearsOfExperience != null && (
              <InfoRow
                label="Experience"
                value={`${profile.yearsOfExperience} years`}
              />
            )}
          </InfoCard>

          <InfoCard title="Practice info">
            {profile.hospitalName && (
              <InfoRow label="Hospital" value={profile.hospitalName} />
            )}
            {profile.clinicName && (
              <InfoRow label="Clinic" value={profile.clinicName} />
            )}
            <InfoRow label="Location" value={location} />
          </InfoCard>

          <InfoCard title="Contact">
            {profile.phone ? (
              <p className="flex items-center gap-2 text-xs text-text-mid">
                <IconPhone size={14} stroke={1.5} />
                {profile.phone}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-xs text-text-faint">
                <IconLock size={14} stroke={1.5} />
                Phone visible to connections
              </p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-xs text-green-primary hover:underline"
              >
                <IconWorld size={14} stroke={1.5} />
                Website
              </a>
            )}
          </InfoCard>
        </>
      )}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-extrabold text-green-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase text-text-muted">
        {label}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rida-card mt-3.5 p-4">
      <h2 className="mb-3 text-sm font-extrabold text-text-dark">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="font-semibold text-text-muted">{label}:</span>
      <span className="text-text-mid">{value}</span>
    </div>
  );
}
