import * as React from "react"

import { cn } from "../lib/utils"
import { picoMeta } from "../lib/pico-meta"

/**
 * The standard single-line text field. Use it for any short text entry — pass
 * a `type` (text, email, password, file, etc.) and the usual native input
 * props. For prefixes, buttons, or icons, reach for `InputGroup`.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...picoMeta("Input")}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
