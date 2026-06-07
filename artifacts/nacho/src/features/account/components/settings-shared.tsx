import { Skeleton } from "@workspace/pico-ui/skeleton";

/** Right-aligned loading bar that mirrors the bold value it replaces. */
export function ValueSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`h-5 ${className ?? "w-16"}`} />;
}
