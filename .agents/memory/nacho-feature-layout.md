---
name: Nacho feature layout
description: How artifacts/nacho/src is organized after the feature-based reorg.
---

`artifacts/nacho/src` is organized by feature/domain under `features/`:
`recording`, `editor`, `library`, `publishing`, `sharing`, `account`, `auth`, `marketing`.

**Conventions:**
- Each feature has `components/`, optional `hooks/`, optional logic modules, and an `index.ts` barrel.
- Feature page components are **named** exports; `pages/*.tsx` are thin **default** re-exports pointing at the feature index (keeps `App.tsx` page imports stable).
- Cross-feature and app-level imports go through the feature `index.ts`, not deep paths.
- App-shared stays in `components/` (app-shell, logo) and `lib/` (api, db, media, utils, types, job-titles). `lib/media` is intentionally global (cross-feature).
- Large screens are split: a logic hook (`use-*.ts`) holds state/effects, presentational components hold JSX. Pattern used for video-player, library, editor, studio.

**Why:** ARCHITECTURE.md mandates feature folders; the 400-line file-size budget forces god-files to be split.

**How to apply:** when adding UI, put it in the right feature, export via that feature's `index.ts`, and keep files under 400 lines.
