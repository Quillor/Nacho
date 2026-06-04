---
name: Shared Pico theme library
description: How design tokens are shared across artifacts so brand updates propagate to every app.
---

# Shared Pico design tokens

The Pico design system's tokens (colors, fonts, radius, chunky offset shadows) live in a CSS-only workspace lib: `lib/pico-theme/theme.css`, package `@workspace/pico-theme`. It exports only `./theme.css` (no TS, no build, not in root tsconfig).

Every consuming app imports it in its own `src/index.css`, in this order (order matters):

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@workspace/pico-theme/theme.css";
@plugin "@tailwindcss/typography";
```

**Why:** The user wants every product (Pico docs site, Nacho, future apps) to inherit Pico token updates from one place. Duplicating the token block per app would break that. Both `artifacts/pico` and `artifacts/nacho` consume this lib.

**How to apply:**
- Edit tokens ONCE in `lib/pico-theme/theme.css`; every app updates automatically.
- A new artifact that should look like Pico: add `"@workspace/pico-theme": "workspace:*"` to its deps, `pnpm install`, and make its `src/index.css` the four lines above (drop any scaffold placeholder `:root` token block).
- Fonts (Bricolage Grotesque display + DM Sans body) load via `<link>` in each app's `index.html`, NOT via `@import url(...)` in CSS — a font `@import` would land mid-file after the tailwind import and be invalid.
- Tailwind v4 shadow/color/radius utilities reference CSS variables, so defining `--shadow-*`, `--background`, `--radius` etc. in `:root` inside the imported theme.css makes `shadow-md`, `bg-primary`, `rounded-lg` etc. resolve correctly. The chunky offset shadows are `Npx Npx 0 0 hsl(var(--foreground))`, so `shadow-*` utilities already produce the brown offset shadow — no arbitrary hex needed.
- The scaffold's `elevate` interaction classes (`hover-elevate`, etc.) become harmless no-ops without the elevate utility CSS; this matches Pico and is acceptable.
