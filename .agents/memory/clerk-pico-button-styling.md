---
name: Styling Clerk's prebuilt components with the Pico theme
description: Why Clerk appearance utility classes can't reach Pico brand colors, and how to force them.
---

When restyling Clerk's prebuilt `<SignIn>`/`<SignUp>` (nacho uses `@clerk/themes` `shadcn` + an `appearance` config), two non-obvious traps make brand-color overrides silently fail.

**1. `!important` + cascade layers reverses precedence.** `index.css` declares
`@layer theme, base, clerk, components, utilities`. For *normal* declarations the
last layer (`utilities`) wins, but for `!important` declarations the order
*reverses* — the earliest layer wins. Clerk/shadcn inject button styles in
`clerk`/`components`, so an `!important` Tailwind utility (`utilities` layer) on
`appearance.elements.formButtonPrimary` LOSES to Clerk's. Non-`!important`
utilities lose too (Clerk uses `!important`). Fix: put the override in an
**earlier** layer than Clerk's, e.g. `@layer base { .cl-formButtonPrimary { ... !important } }`.

**2. The shadcn theme reassigns shadcn vars (`--primary`, `--accent`, ...) inside the Clerk card scope.** Pico stores raw HSL components (`--accent: 47 91% 53%`) meant for `hsl(var(--accent))`, but inside `.cl-*` the shadcn theme rebinds `--accent` to its own value. So `hsl(var(--accent))` does NOT resolve to Pico yellow there — `bg-accent`/`hsl(var(--accent))` come out wrong/cream. `var()` substitution is lazy (resolved at the using element), so re-aliasing at `:root` does not escape it. Fix: use **literal** Pico HSL values in the `.cl-formButtonPrimary` override (`hsl(47 91% 53%)` fill, `hsl(25 60% 12%)` text), with a comment pointing back to the Pico tokens.

**Debugging tip:** if a Clerk element won't take a color, probe with a named color + `outline` (`background: lime !important; outline: 3px solid red`) in the base-layer rule. If it shows, your selector/layer is fine and the problem is the *value* (var scoping), not the cascade.

**Autocomplete warnings:** Clerk's prebuilt inputs lack `autocomplete` on some steps and expose no prop for it. A small MutationObserver hook (`useClerkAutocomplete`) that sets `current-password`/`new-password`/`username`/`email` on `.cl-formFieldInput` clears the console warning and enables password-manager autofill.
