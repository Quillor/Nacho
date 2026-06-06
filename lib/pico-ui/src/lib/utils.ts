import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind class names with conflict resolution.
 *
 * `clsx` first flattens conditional/array/object inputs into one string; then
 * `twMerge` dedupes *conflicting* Tailwind utilities so the last one wins
 * (e.g. `cn("p-2", isLg && "p-4")` → `"p-4"`, not both). Plain string
 * concatenation can't do this — two padding classes would both apply and the
 * cascade, not call order, would decide. Use this anywhere a base class is
 * combined with caller-supplied `className` overrides.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
