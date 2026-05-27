"use client";

import { useSession } from "next-auth/react";
import {
  IconArticle,
  IconCamera,
  IconStethoscope,
} from "@tabler/icons-react";
import { UserAvatar } from "@/components/shared/user-avatar";

export function PostComposer() {
  const { data: session } = useSession();

  return (
    <div className="rida-card px-3.5 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          name={session?.user?.fullName ?? "You"}
          size={36}
        />
        <div className="flex-1 rounded-[20px] border-[0.5px] border-[#d8d0c0] bg-cream-input px-4 py-2.5 text-xs text-text-faint">
          Share a case, article or update…
        </div>
      </div>
      <div className="mt-3 border-t-[0.5px] border-cream-divider pt-2.5">
        <div className="flex gap-1">
          <ComposerAction icon={IconCamera} label="Photo" />
          <ComposerAction icon={IconArticle} label="Article" />
          <ComposerAction icon={IconStethoscope} label="Case" />
        </div>
      </div>
    </div>
  );
}

function ComposerAction({
  icon: Icon,
  label,
}: {
  icon: typeof IconCamera;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-green-primary transition-colors hover:bg-green-pale"
    >
      <Icon size={16} stroke={1.5} />
      {label}
    </button>
  );
}
