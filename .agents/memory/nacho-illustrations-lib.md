---
name: Nacho illustrations lib
description: How the shared @workspace/nacho-illustrations asset package is structured and imported.
---

`@workspace/nacho-illustrations` (`lib/nacho-illustrations/`) holds the brand's
retro-cartoon nacho character PNGs (transparent background). It is an
**assets-only** package — no TypeScript, no build step — mirroring the
`@workspace/pico-theme` convention.

**Rule:** keep it assets-only. Do not turn it into a composite TS lib or add it
to the root `tsconfig.json` references.

**Why:** image-only packages don't need declaration emit; an all-composite setup
for leaf-style packages causes TS portability issues, and pico-theme already set
this precedent.

**How to apply / import:** package.json `exports` maps `"./assets/*":
"./assets/*"`. Consumers import the URL directly, e.g.
`import url from "@workspace/nacho-illustrations/assets/nacho-hammock.png"`.
Vite resolves the subpath and returns the asset URL; `*.png` typing comes from
`vite/client` (already in pico's tsconfig `types`). Add the package to a
consuming artifact's deps as `"@workspace/nacho-illustrations": "workspace:*"`.
Asset basenames are descriptive: sad-nacho-empty-bowl, nacho-presenting-laptop,
jalapeno-character, nacho-cheese-jump, nacho-video-lesson, nacho-hammock.
