---
name: Server-side Clerk auth in api-server
description: How the api-server authenticates the signed-in user and authorizes per-owner mutations
---

The api-server resolves the signed-in Clerk user with `getAuth(req)` from `@clerk/express` (the `clerkMiddleware` is already mounted globally in `app.ts`). `CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` are configured in **both dev and prod**, so server-side auth works in dev too — Clerk is not "UI-only" anymore.

**Why:** Auth was historically described as gating the UI only ("routes are not per-user"). When an endpoint can *mutate* shared state (e.g. flipping a recording's visibility), shareId alone is a bearer capability and a leaked public link could be toggled by anyone. Owner binding closes that IDOR.

**How to apply:**
- The browser calls the API with same-origin `fetch` and must pass `credentials: "include"` so the Clerk session cookie reaches the api-server (same proxy domain, different path).
- For owner-only mutations, scope the SQL by `ownerUserId = getAuth(req).userId` and return 404 (not 403) on a non-match to avoid leaking existence.
- Keep public read paths (`GET /recordings/:shareId`, `/s/:shareId`, views) unauthenticated — local-first access stays open; only writes are owner-gated.
