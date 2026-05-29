"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatProfileName, formatRoleLabel } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { useMessagingStore } from "@/lib/stores/messaging-store";

interface ConnectionItem {
  id: string;
  status: string;
  direction: string;
  otherUser: { id: string; fullName: string; role: string };
  profile?: {
    firstName: string;
    lastName: string;
    specialty: string;
    hospitalName?: string | null;
  } | null;
}

type Tab = "pending" | "sent" | "connected";

export function ConnectionList() {
  const [items, setItems] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const json = await res.json();
      if (res.ok) setItems(json.connections);
    } catch {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Action failed");
        return;
      }
      toast.success(status === "ACCEPTED" ? "Connected!" : "Request declined");
      load();
    } catch {
      toast.error("Action failed");
    }
  };

  const pending = items.filter(
    (i) => i.status === "PENDING" && i.direction === "received"
  );
  const sent = items.filter(
    (i) => i.status === "PENDING" && i.direction === "sent"
  );
  const connected = items.filter((i) => i.status === "ACCEPTED");
  const displayed =
    tab === "pending" ? pending : tab === "sent" ? sent : connected;

  return (
    <div>
      <div className="mb-5 flex gap-2">
        <TabButton
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label={`Requests (${pending.length})`}
        />
        <TabButton
          active={tab === "sent"}
          onClick={() => setTab("sent")}
          label={`Sent (${sent.length})`}
        />
        <TabButton
          active={tab === "connected"}
          onClick={() => setTab("connected")}
          label={`Connections (${connected.length})`}
        />
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="py-12 text-center text-xs text-text-muted">
          {tab === "pending"
            ? "No incoming requests"
            : tab === "sent"
              ? "No pending sent requests"
              : "No connections yet"}
          .{" "}
          <Link href="/search" className="font-semibold text-green-primary">
            Find people
          </Link>
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {displayed.map((item) => {
            const name = item.profile
              ? formatProfileName(
                  item.otherUser.role,
                  item.profile.firstName,
                  item.profile.lastName
                )
              : item.otherUser.fullName;

            return (
              <div key={item.id} className="rida-card flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar name={name} size={40} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${item.otherUser.id}`}
                      className="text-xs font-bold text-text-dark hover:text-green-primary"
                    >
                      {name}
                    </Link>
                    {item.otherUser.role === "MEDICAL_STUDENT" && (
                      <p className="text-[10px] font-semibold text-text-muted">
                        {formatRoleLabel(item.otherUser.role)}
                      </p>
                    )}
                    {item.profile?.specialty && (
                      <p className="text-[10px] font-bold text-green-primary">
                        {item.profile.specialty}
                      </p>
                    )}
                    {item.profile?.hospitalName && (
                      <p className="text-[10px] text-text-muted">
                        {item.profile.hospitalName}
                      </p>
                    )}
                  </div>
                </div>
                {tab === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleAction(item.id, "ACCEPTED")}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleAction(item.id, "REJECTED")}
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {tab === "sent" && (
                  <p className="text-center text-[10px] font-semibold text-text-muted">
                    Awaiting response
                  </p>
                )}
                {tab === "connected" && (
                  <Button
                    variant="cream"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/conversations/start", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            targetDoctorId: item.otherUser.id,
                          }),
                        });
                        const json = await res.json();
                        if (!res.ok) {
                          toast.error(
                            json.error ?? "Connect with this doctor to message them"
                          );
                          return;
                        }
                        useMessagingStore
                          .getState()
                          .openConversation(json.conversationId);
                      } catch {
                        toast.error("Failed to start conversation");
                      }
                    }}
                  >
                    Message
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
        active
          ? "bg-green-primary text-cream-surface"
          : "border-[0.5px] border-cream-border bg-cream-surface text-text-muted hover:bg-green-pale"
      )}
    >
      {label}
    </button>
  );
}
