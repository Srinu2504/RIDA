import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <>
      {/* hero strip skeleton */}
      <div className="border-b-[0.5px] border-[#e5ddd0] bg-cream-surface px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-[50px] w-[50px] rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex gap-6 md:gap-10">
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-10 w-14" />
          </div>
        </div>
      </div>

      {/* tabs skeleton */}
      <div className="hidden border-b-[0.5px] border-cream-border bg-cream-surface md:block">
        <div className="mx-auto flex max-w-[1200px] gap-0 px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mx-3 my-3 h-4 w-16" />
          ))}
        </div>
      </div>

      {/* feed skeleton */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3.5 px-4 py-3.5 md:px-[22px] lg:grid-cols-[1fr_200px]">
        <div className="flex flex-col gap-3.5">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="hidden flex-col gap-3.5 lg:flex">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}
