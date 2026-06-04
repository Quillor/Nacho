---
name: Figma plugin page reader & render step
description: How Pico's Figma plugin reads pages, resolves components/variables, and stays idempotent
---

# Page-from-URL reader

- **No headless browser is available** (no chromium, can't install reliably, and a Figma plugin can't run a browser anyway). The page reader fetches *delivered* HTML only — purely client-rendered SPAs return their empty shell and won't carry `data-pico-*` instrumentation. This is an environment constraint, not a bug; treat full JS rendering as out of reach here.
  **How to apply:** point the reader at server-rendered / static pages whose delivered HTML already has the instrumentation.

- **Companion fetch endpoint** `GET /api/render?url=` lives in `artifacts/api-server` (`routes/render.ts`). The plugin UI calls it when a "Render service" base URL is set, otherwise it does a direct `fetch`. Reason: a plugin iframe hits CORS on most cross-origin sites; a server-side fetch sidesteps that.
  **Why guarded:** an open URL-fetch proxy is an SSRF risk — it rejects private/loopback/link-local/cloud-metadata IPs and re-validates every redirect hop. Keep that guard if you touch the endpoint.

- **Component resolution is local OR linked library.** `ComponentResolver` in `page.ts` scans local components, then harvests INSTANCE nodes and resolves each `getMainComponentAsync()` to register remote (published-library) main components/sets by name. Library main components are NOT in the document tree unless an instance of them exists. Color variables resolve the same way: local first, then `teamLibrary` import in `figma-helpers.findColorVariable`.

- **Idempotency = full clear, not name-by-name delete.** `generateComponents` wipes every child of the plugin-owned `Pico / Components` page before rebuilding. Name-based deletion left stale duplicates (heading labels shared component names). Headings are also named `"<Name> — label"` so they can't collide.
  **Why:** the page is owned entirely by the plugin, so clearing it is safe and deterministic.
