import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

import { picoMeta } from "../lib/pico-meta"

/**
 * Constrains its content to a fixed width-to-height ratio. Pass the desired
 * `ratio` (e.g. 16 / 9) and use it to keep images, video, or embeds from
 * shifting layout as they load.
 */
function AspectRatio(
  props: React.ComponentProps<typeof AspectRatioPrimitive.Root>
) {
  return <AspectRatioPrimitive.Root {...picoMeta("AspectRatio")} {...props} />
}

export { AspectRatio }
