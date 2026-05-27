import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5">
      <Skeleton className="mb-5 h-10 w-48" />
      <Skeleton className="mb-5 h-40 w-full" />
      <div className="grid gap-3.5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
