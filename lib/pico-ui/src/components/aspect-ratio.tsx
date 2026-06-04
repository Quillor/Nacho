import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

import { picoMeta } from "../lib/pico-meta"

function AspectRatio(
  props: React.ComponentProps<typeof AspectRatioPrimitive.Root>
) {
  return <AspectRatioPrimitive.Root {...picoMeta("AspectRatio")} {...props} />
}

export { AspectRatio }
