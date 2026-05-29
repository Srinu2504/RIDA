"use client";

import { PageBackHeader } from "@/components/shared/page-back-header";

export function ProfilePageHeader() {
  return (
    <div className="mx-auto max-w-[680px] px-4 md:px-0">
      <PageBackHeader title="Profile" fallbackHref="/feed" />
    </div>
  );
}
