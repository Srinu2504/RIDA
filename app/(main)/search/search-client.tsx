"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { DoctorCard } from "@/components/search/doctor-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/validations";
import type { DoctorSearchResult } from "@/types";

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [specialty, setSpecialty] = useState(
    searchParams.get("specialty") ?? "all"
  );
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [gender, setGender] = useState("all");

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (specialty && specialty !== "all") params.set("specialty", specialty);
    if (city) params.set("city", city);
    if (country) params.set("country", country);
    if (minExperience) params.set("minExperience", minExperience);
    if (gender && gender !== "all") params.set("gender", gender);

    try {
      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      if (res.ok) setDoctors(json.doctors);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, [q, specialty, city, country, minExperience, gender]);

  const initialLoad = useRef(true);

  useEffect(() => {
    if (!initialLoad.current) return;
    initialLoad.current = false;
    search().catch(() => {});
  }, [search]);

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
      search();
    } catch {
      toast.error("Failed to connect");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-[17px] font-extrabold text-text-dark">
          Discover doctors
        </h1>
        <p className="text-[11px] text-text-muted">
          Search by name, specialty, hospital, or location
        </p>
      </div>

      <div className="rida-card mb-5 space-y-4 p-4">
        <div>
          <Label>Search</Label>
          <Input
            pill
            placeholder="Name, specialty, hospital, city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Specialty</Label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div>
            <Label>Min. experience (years)</Label>
            <Input
              type="number"
              min={0}
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            />
          </div>
        </div>
        <div className="max-w-xs">
          <Label>Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={search}>Search</Button>
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
              No doctors found. Try different filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
