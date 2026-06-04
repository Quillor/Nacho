# Nacho → Pico Design System Mapping

An audit of every UI component Nacho renders in its product screens, mapped to its
Pico design-system equivalent and documentation page. The goal: Nacho consumes the
Pico component vocabulary, and any component Nacho relies on is documented in Pico.

The chunky brutalist brand look (golden yellow / deep brown / cream, `border-2/4
border-foreground`, hard shadows) is expressed by applying brand classNames on top
of these primitives — the primitives provide structure and behavior, the classNames
provide the look.

## Components Nacho uses directly

| Nacho component (`@/components/ui/*`) | Used in | Pico doc page | Status |
| --- | --- | --- | --- |
| `button` | nearly every screen | `/components/button` | Documented |
| `input` | account-management, editor, studio | `/components/input` | Documented |
| `label` | account-management, studio, editor | `/components/label` | **Added** |
| `card` | account-management, library | `/components/card` | Documented |
| `badge` | library, editor | `/components/badge` | Documented |
| `tabs` | editor | `/components/tabs` | Documented |
| `switch` | studio | `/components/switch` | Documented |
| `select` | studio (caption language) | `/components/select` | **Added** |
| `alert-dialog` | library, settings (confirmations) | `/components/alert-dialog` | **Added** |
| `toast` / `toaster` (via `use-toast`) | app-wide feedback | `/components/toast` | **Added** |
| `tooltip` | App.tsx (`TooltipProvider` only) | — | Provider wrapper only, not rendered |

## Not in scope (transitive only)

`separator`, `textarea`, `toggle`, `skeleton`, and `sheet` exist in `@/components/ui`
but Nacho never renders them in its screens — they appear only *inside* unused shadcn
library files (`sidebar.tsx`, `field.tsx`, `input-group.tsx`, `toggle-group.tsx`).
Nacho ships its own `app-shell` instead of the shadcn sidebar, so these are not part
of Nacho's component surface and were not documented.

## Custom Nacho components

| Custom component | Built on | Notes |
| --- | --- | --- |
| `account-management` | `Card`, `Input`, `Label`, `Button`, `useToast` | Card containers now use the `<Card>` primitive with brand classNames (chunky border, no rounding/shadow) instead of raw `<div>`s. |
| `app-shell` | `Button`, brand tokens | Custom navigation chrome; intentionally not the shadcn `Sidebar`. |
| `rich-text-editor` | `Button`, `Toggle`-style controls | Editor toolbar built on design-system buttons. |

## Newly documented in Pico

Four component docs were added so the library covers everything Nacho relies on:
**Label**, **Select**, **Alert Dialog**, and **Toast** — each with a live preview,
copy-paste code, and on-brand guidance consistent with the existing component pages.
