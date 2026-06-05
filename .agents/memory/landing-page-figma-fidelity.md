---
name: Landing page → Figma export fidelity
description: Why arbitrary Tailwind overrides on Pico components break the Figma export, and how to author marketing pages so the export matches the site.
---

The Figma export reconstructs a page from the DOM by reading each node's
`data-pico-component` + `data-pico-<axis>` (e.g. `data-pico-variant`) and rendering
the **canonical** Pico component/variant — it does NOT replay arbitrary Tailwind
classes layered on top.

**Rule:** drive a component's color/identity from its variant + theme tokens, not
from override classes. Keep only layout (flex/grid/gap/aspect/max-w) and
token-based utilities (`shadow-sm`..`shadow-xl`, `border-4`, `rounded-sm`, the
`text-*`/`leading-*` ramp) on top.

**Why:** if you write `<Badge variant="default" className="bg-background text-foreground border-2 rounded-sm">`, the site shows a cream bordered pill but the export shows a plain yellow default Badge — they diverge. Same for Buttons restyled with `bg-background`/`rounded-none`/`h-16` and feature cards hand-rolled as `<motion.div>` (no `data-pico-component="Card"` → export loses the card entirely).

**How to apply when building/auditing a Pico marketing page:**
- Pick the variant whose canonical look matches the intent (`secondary` = brown solid, `outline`, `brand` = chunky yellow CTA, `destructive` = red). Don't recolor a variant with classes.
- Use the real `Card` for cards; full-bleed media bands go in a child div (Card has no padding itself), content in a `p-8` child.
- Replace opacity color hacks on card body (`text-card-foreground/80`) with `text-muted-foreground`. (Muted body copy on hero/section paragraphs via `text-foreground/80` is canonical — the design-system docs use it.)
- Contrast: never `text-primary` (yellow) on cream; yellow is a fill. `text-primary` on `bg-foreground`/`bg-secondary` (brown) is fine (Combo A/B).
- `brand` button is designed for light surfaces (border/shadow are brown); on a dark `bg-foreground` section its border/shadow vanish but the yellow fill still pops — acceptable, and it keeps the export a clean `variant=brand`.
