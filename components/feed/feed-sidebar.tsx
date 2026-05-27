"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { DoctorSearchResult } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SPECIALTIES } from "@/lib/validations";

interface FeedSidebarProps {
  suggestions: DoctorSearchResult[];
}

export function FeedSidebar({ suggestions }: FeedSidebarProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (userId: string) => {
    setConnecting(userId);
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
    } catch {
      toast.error("Failed to connect");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <aside className="hidden w-[200px] shrink-0 flex-col gap-3.5 lg:flex">
      <div className="rida-card p-3.5">
        <h3 className="mb-3 text-xs font-bold text-text-dark">
          People to connect
        </h3>
        <ul className="space-y-0">
          {suggestions.slice(0, 5).map((doc, i) => (
            <li
              key={doc.userId}
              className={
                i > 0 ? "border-t-[0.5px] border-[#f0e8d8] pt-2.5 mt-2.5" : ""
              }
            >
              <div className="flex items-center gap-2">
                <UserAvatar
                  name={`${doc.firstName} ${doc.lastName}`}
                  src={doc.profilePhoto}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${doc.userId}`}
                    className="block truncate text-[11px] font-bold text-text-dark hover:text-green-primary"
                  >
                    Dr. {doc.firstName} {doc.lastName}
                  </Link>
                  <p className="truncate text-[10px] text-text-muted">
                    {doc.specialty}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={connecting === doc.userId}
                  onClick={() => handleConnect(doc.userId)}
                  className="shrink-0 rounded-md border border-green-primary px-2 py-0.5 text-[10px] font-semibold text-green-primary transition-colors hover:bg-green-pale disabled:opacity-50"
                >
                  + Add
                </button>
              </div>
            </li>
          ))}
          {suggestions.length === 0 && (
            <p className="text-[10px] text-text-muted">No suggestions yet</p>
          )}
        </ul>
      </div>

      <div className="rida-card p-3.5">
        <h3 className="mb-3 text-xs font-bold text-text-dark">
          Browse specialty
        </h3>
        <ul className="space-y-0">
          {SPECIALTIES.slice(0, 8).map((s, i) => (
            <li key={s}>
              <Link
                href={`/search?specialty=${encodeURIComponent(s)}`}
                className="flex items-center gap-2 rounded-md py-1.5 transition-colors hover:bg-green-pale"
              >
                <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-green-primary" />
                <span className="flex-1 text-[11px] text-text-mid">{s}</span>
                <span className="text-[10px] text-text-muted">—</span>
              </Link>
              {i < 7 && (
                <div className="border-t-[0.5px] border-[#f0e8d8]" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
