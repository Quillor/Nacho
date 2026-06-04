"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

import { picoMeta } from "../lib/pico-meta"

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
