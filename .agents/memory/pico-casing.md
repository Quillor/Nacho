---
name: Pico headline casing
description: When to use uppercase vs sentence case for Pico typography
---
Pico headlines render in **sentence case**, not all-caps. The brand's signature
all-caps is reserved for *small UI labels only*: eyebrow/kicker labels, nav items,
sidebar group labels, table headers (`thead`), form `<Label>`s, badges, chunky CTA
buttons, and the `Pico.` brand wordmark/logo.

**Why:** User explicitly asked to stop shouting headlines ("Don't use all caps,
use sentence casing for headlines") after the Platypi font swap made caps headlines
dominant.

**How to apply:** Headlines (h1-h6, large `font-display` display text, dialog/sheet
titles) must NOT carry the Tailwind `uppercase` class. Keep `uppercase` on lines
that also have `tracking-wide/wider/widest`, `text-xs/sm`, or are nav/labels/wordmarks.
There is no central token — `uppercase` is applied per element in artifact pages
(none in `lib/pico-ui`); `DocsLayout.tsx` logo lines are intentionally left caps.
