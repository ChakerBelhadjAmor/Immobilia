import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(110deg,var(--color-sand-100)_40%,var(--color-sand-200)_50%,var(--color-sand-100)_60%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

/** Skeleton shaped like a property card, used while listings load. */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-sand-200 bg-white shadow-card">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}
