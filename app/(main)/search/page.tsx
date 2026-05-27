import { Suspense } from "react";
import SearchPageClient from "./search-client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1200px] px-4 py-12 text-center text-xs text-text-muted">
          Loading…
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
