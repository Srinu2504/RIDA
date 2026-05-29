"use client";

import { PageBackHeader } from "@/components/shared/page-back-header";
import { RidaNewsPanel } from "@/components/feed/rida-news-panel";

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      <div className="mx-auto max-w-[560px] px-4 py-5 md:px-6">
        <PageBackHeader
          title="Top stories"
          subtitle="Ranked by likes and comments — photos, articles, and case studies"
          fallbackHref="/feed"
        />
        <RidaNewsPanel compact={false} />
      </div>
    </div>
  );
}
