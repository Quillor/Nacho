import { Loader2Icon } from "lucide-react"

import { cn } from "../lib/utils"
import { picoMeta } from "../lib/pico-meta"

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
