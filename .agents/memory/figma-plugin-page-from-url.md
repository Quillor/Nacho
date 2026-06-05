---
name: Figma plugin "Page from URL" — headless render + never dead-end
description: The render service now headless-renders SPAs and allows Replit hosts; the compose fallback stays as a safety net.
---

# "Page from URL" recreates the real page, and never dead-ends

**What changed:** The two old blockers are gone.
1. `/api/render` now drives a headless Chromium (`REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`
   + `playwright-core`) so client-rendered SPAs (Nacho, the Pico docs site) come back
   with their hydrated `data-pico-*` instrumentation — not an empty shell. It inlines
   computed styles so the importer sees real colors/type/spacing. See
   `figma-plugin-page-reader.md` for the mechanism.
2. The SSRF guard now allows public Replit hosts (`*.replit.app`/`*.replit.dev`/
   `*.repl.co`) by hostname, so fetching your own deployed app works even though it
   resolves to a private cluster IP in dev. The private-IP block still applies to all
   other hosts.

**Rule (still in force):** "Page from URL" must never surface a hard error. If render
fails (no browser binary in some env, non-Replit private host, genuinely empty page),
the UI posts `reconstruct-page` with an empty tree and the code side self-heals by
composing a page from real Pico component instances + tokens (`composeSamplePage` /
non-substantive check in `reconstructPage`). Keep the fallback in the UI `btn-page`
catch block AND the code-side substantive check — don't rely on just one.

**How to apply:** Faithful recreation now works for any page carrying `data-pico-*`
instrumentation (SSR *or* client-rendered, since we render it). The composed fallback
is for the rare case the page can't be read at all. Don't "fix" the feature by
loosening the SSRF guard further — headless render + the Replit-host allowance already
cover the common case.
