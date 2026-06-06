import { cn } from "../lib/utils"
import { picoMeta } from "../lib/pico-meta"

/**
 * Skeleton is a pulsing placeholder block for content that hasn't loaded yet.
 * Size it with width/height utilities to mirror the shape of the incoming content.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-accent/10", className)}
      {...picoMeta("Skeleton")}
      {...props}
    />
  )
}

export { Skeleton }
