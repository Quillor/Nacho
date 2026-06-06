import * as React from "react"

import { cn } from "../lib/utils"
import { picoMeta } from "../lib/pico-meta"

/**
 * Textarea is the styled multi-line text input for longer free-form entry.
 * Use it for comments, descriptions, or notes where a single-line Input is too small.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...picoMeta("Textarea")}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
