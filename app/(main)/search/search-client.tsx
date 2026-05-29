"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { DoctorCard } from "@/components/search/doctor-card";
import { PageBackHeader } from "@/components/shared/page-back-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { DoctorSearchResult } from "@/types";

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [q, setQ] = useState(
    () => searchParams.get("q") ?? searchParams.get("specialty") ?? ""
  );

  const search = useCallback(async (query: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());

    try {
      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      if (res.ok) setDoctors(json.doctors);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const isFirstSearch = useRef(true);

  useEffect(() => {
    const delay = isFirstSearch.current ? 0 : 300;
    isFirstSearch.current = false;
    const timer = setTimeout(() => {
      search(q).catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [q, search]);

  const handleConnect = async (receiverId: string) => {
    setConnecting(receiverId);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to connect");
        return;
      }
      toast.success("Connection request sent");
      search(q);
    } catch {
      toast.error("Failed to connect");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6">
      <PageBackHeader
        title="Discover"
        subtitle="Search by name, specialty, hospital, or location"
      />

      <div className="mb-5">
        <Input
          pill
          placeholder="Name, specialty, hospital, city…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.userId}
              doctor={doctor}
              onConnect={handleConnect}
              loading={connecting === doctor.userId}
            />
          ))}
          {doctors.length === 0 && (
            <p className="col-span-full py-12 text-center text-xs text-text-muted">
              {q.trim()
                ? "No results found. Try a different search."
                : "No people to show yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
