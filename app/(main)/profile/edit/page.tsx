"use client";

import { useSession } from "next-auth/react";
import { PageBackHeader } from "@/components/shared/page-back-header";
import { ProfileWizard } from "@/components/profile/profile-wizard";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const profileHref = session?.user?.id
    ? `/profile/${session.user.id}`
    : "/feed";

  return (
    <div className="pb-6 pt-2">
      <div className="mx-auto max-w-[680px] px-4 md:px-0">
        <PageBackHeader title="Edit profile" fallbackHref={profileHref} />
      </div>
      <ProfileWizard mode="edit" />
    </div>
  );
}
