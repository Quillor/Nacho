---
name: Pico contrast rules
description: How to use the golden-yellow primary token without creating low-contrast text in the Pico theme.
---

# Pico theme contrast

The Pico palette is cream background (`--background`, very light), deep-brown foreground, and golden-yellow `--primary` (mid-lightness). `--card`/`--popover`/`--muted` are all light too.

**Rule: never use `text-primary` (or yellow icons) on cream/light surfaces.** Yellow-on-cream is ~1.4:1 — unreadable. The yellow is a *fill* color: use `bg-primary` with `text-primary-foreground` (brown) on top.

**Why:** A readability pass found yellow timestamps, yellow check icons, and `prose-a:text-primary` links that were illegible on the cream/card backgrounds.

**How to apply:**
- Clickable timestamps / metadata on light surfaces → `text-foreground` (or `text-muted-foreground` for secondary), bold/mono to distinguish.
- Prose links → `prose-a:text-foreground` + underline (e.g. `prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2`), not yellow.
- `text-primary` is only OK on dark surfaces (`bg-foreground`, `bg-secondary`) where yellow-on-brown has strong contrast.
- Reduced-opacity brown (`text-foreground/80`, `text-card-foreground/80`) on cream is fine; reduced-opacity cream on dark is fine.
