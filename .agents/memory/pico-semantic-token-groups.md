---
name: Pico semantic token groups & card retention
description: How Pico semantic color tokens are grouped into usage-families for Figma, and why the card* CSS vars are kept despite being dropped from the manifest.
---

# Pico semantic token grouping

Semantic color tokens are organized into **usage-families** (surface, primary,
secondary, secondary-surface, muted, accent, danger, popover, field). Each family
emits paired Figma variable names of the form `<group>/<group>-<role>` — e.g.
`danger/danger-background`, `danger/danger-foreground`, `danger/danger-border`,
`accent/accent-background`. The grouping lives in `SEMANTIC_GROUPS` in
`lib/pico-theme/scripts/generate-tokens.mjs` and is emitted as `semanticGroups`
(plus a `colorAliases` map) into `tokens.json`. The Figma plugin resolves names
via `colorFigmaPath(name, set)` in `lib/pico-figma-plugin/src/shared/tokens.ts`,
falling back to flat `color/<name>` when `semanticGroups` is absent.

**Why:** the Figma variable tree should mirror how tokens are used together (a
fill + its text + its border), not be a flat alphabetical dump.

## card / card-foreground tokens

The `card`/`card-foreground`/`card-border` entries are **excluded from the token
manifest, Figma export, and the docs**, but the underlying `--card*` CSS vars in
`theme.css` are **kept**.

**Why:** ~30+ files across the Nacho/Admin artifacts still use `bg-card` /
`text-card-foreground` Tailwind utilities. Deleting the CSS vars would break them.
`colorAliases` maps `card → surface/*` so the Figma side resolves cleanly.

**How to apply:** if asked to "remove" a token that has live Tailwind consumers,
prefer dropping it from the manifest/Figma/docs while keeping the CSS var, rather
than a hard delete — unless every consumer is migrated first.

## Dark-mode legibility rule (reaffirmed)

On any fixed-yellow surface (`bg-primary`, `bg-accent`) the text/border must use
the `*-foreground` token (`text-primary-foreground` etc.), which is brown in BOTH
modes. Plain `text-foreground` flips to cream in dark → cream-on-yellow is
illegible. This applies to the landing-page hero/section wrappers and the docs
sidebar header too, not just components.
