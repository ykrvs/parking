import { percentIndicatorColor } from "@/lib/dashboard/dashboard-data";
import { cn } from "@/lib/utils";

export function PercentDot({ pct }: { pct: number | null | undefined }) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 rounded-full shrink-0",
        percentIndicatorColor(pct),
      )}
      aria-hidden="true"
    />
  );
}

export function UnverifiedDot({ isVerified }: { isVerified?: boolean }) {
  if (isVerified !== false) return null;

  return (
    <span
      title="Not yet verified by an admin"
      aria-label="Not yet verified by an admin"
      className="inline-block size-2 rounded-full bg-red-600 shrink-0"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-200/70", className)}
      aria-hidden="true"
    />
  );
}
