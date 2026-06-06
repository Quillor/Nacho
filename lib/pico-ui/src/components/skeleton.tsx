import { cn } from "../lib/utils"
import { picoMeta } from "../lib/pico-meta"

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
