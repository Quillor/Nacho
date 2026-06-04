---
name: Nacho artifact base path
description: The real base path of the Nacho web artifact and how share/unfurl URLs must compose it
---

The Nacho web artifact is served at the **root** (`previewPath = "/"`, `BASE_PATH = "/"` in its `artifact.toml`). The public viewer route is therefore `/v/:shareId`, not `/nacho/v/:shareId`.

**Why:** `replit.md` historically claimed "Nacho previewPath is `/nacho/`", and `share.ts` defaulted `NACHO_BASE` to `/nacho/`. That produced broken share links — `/s/:shareId` redirected to a non-existent `/nacho/v/:shareId`. The server `/s/:shareId` unfurl route is mounted by the api-server (its `artifact.toml` lists `paths = ["/api", "/s"]`).

**How to apply:** When building share/unfurl/redirect URLs, the SPA base is `/`. `NACHO_BASE` defaults to `/` (overridable via `NACHO_BASE_PATH`). Don't trust the `/nacho/` claim in older docs.
