"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

import { picoMeta } from "../lib/pico-meta"

/**
 * Show and hide a single section of content. Wrap a `CollapsibleTrigger` and
 * `CollapsibleContent` inside `Collapsible` for simple expand/collapse toggles
 * like "show more" rows or optional detail panels.
 */
function Collapsible(
  props: React.ComponentProps<typeof CollapsiblePrimitive.Root>
) {
  return <CollapsiblePrimitive.Root {...picoMeta("Collapsible")} {...props} />
}

function CollapsibleTrigger(
  props: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>
) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      {...picoMeta("CollapsibleTrigger")}
      {...props}
    />
  )
}

function CollapsibleContent(
  props: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>
) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      {...picoMeta("CollapsibleContent")}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
