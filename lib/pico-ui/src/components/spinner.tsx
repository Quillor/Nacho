import { Loader2Icon } from "lucide-react"

import { cn } from "../lib/utils"
import { picoMeta } from "../lib/pico-meta"

/**
 * Spinner is a small spinning indicator for in-progress, indeterminate work.
 * Use it inside buttons or beside text; size it with the `size-*` utilities.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      {...picoMeta("Spinner")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
