# Pico Design System

A single-page design system documentation site for "Pico" — a bold, playful, high-contrast brand system (golden yellow, deep brown, cream) covering spacing, typography, color palette, color combinations, and common components.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed-dev-users` — seed two real Clerk test users (normal + super-admin), idempotent, prints credentials
- Required env: `DATABASE_URL` — Postgres connection string

### Dev-only testing mode (auth bypass)

A development-only switch to skip the Clerk sign-in wall while testing. Impossible to activate in production; default OFF (the normal Clerk gate is unchanged).

- **In-app toggle (no env vars / restarts needed):** the Nacho and Admin sign-in pages render a dev-only "Development mode" section (gated behind `import.meta.env.DEV`, so it's absent from prod builds) with a switch that turns the bypass on/off end-to-end at runtime. Flipping it persists a `nacho_dev_bypass` flag in `localStorage`, mirrors it into a same-origin `nacho_dev_bypass` cookie the API server reads, and hard-navigates so all gates re-evaluate (on → studio / admin dashboard, off → sign-in). The toggle/cookie/localStorage are tri-state (on / explicit-off / unset→env default), so an explicit OFF overrides an env var that defaults ON.
- **Testing mode banner:** while the bypass is active, a persistent high-contrast Pico banner (`components/testing-mode-banner.tsx` in both apps) renders at the top of the app so it's obvious the sign-in wall is off. Never renders in production.
- **Env-var path (still works as the default/initial state):** set both (in the **development** environment only): `VITE_DEV_AUTH_BYPASS=true` (frontend, Nacho + Admin) and `DEV_AUTH_BYPASS=true` (api-server), then restart the `nacho`, `admin`, and `api-server` workflows. This is the fallback used when nothing is persisted/no cookie is present.
- Frontend gate: `isDevAuthBypassEnabled()` (hard-gated behind `import.meta.env.DEV` → folds to `false` in prod builds, dead-code eliminated; resolves the persisted flag, falling back to `VITE_DEV_AUTH_BYPASS`). `setDevAuthBypass(enabled)` persists + writes the cookie. Lives in `src/lib/dev-auth.ts` in both `artifacts/nacho` and `artifacts/admin` (duplicated — artifacts can't import each other; keep the two copies in sync).
- Server gate: `isDevAuthBypass(req)` in `artifacts/api-server/src/lib/devAuth.ts` — per-request, returns `false` whenever `NODE_ENV === "production"` (cookie inert in prod); otherwise honors the dev `nacho_dev_bypass` cookie (`"1"`/`"0"`), falling back to the `DEV_AUTH_BYPASS` env var. When on, `authUserId(req)` returns a fixed `DEV_USER_ID` and `requireSuperAdmin` short-circuits before any Clerk lookup.
- Seeded data: the Nacho Library auto-seeds 3 playable sample recordings (canvas+MediaRecorder, generated at runtime) once when bypass is on and the library is empty; a dev-only "Seed samples" button re-seeds on demand (`artifacts/nacho/src/lib/dev-seed.ts`, loaded via dynamic import so it's excluded from prod bundles).
- Two seeded Clerk users (`dev-user@nacho.test`, `dev-admin@nacho.test`) are created by the `seed-dev-users` script for the real sign-in path; it refuses to run when `NODE_ENV=production`. Passwords are never committed — each run generates a strong random password (or reads `DEV_SEED_USER_PASSWORD` / `DEV_SEED_ADMIN_PASSWORD` if set) and prints the resulting credentials once on completion.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Nacho recorder app: `artifacts/nacho/src` — `lib/` (recorder, transcribe, gif, publish, db IndexedDB, api helpers), `pages/` (home, studio, library, editor, public-view, settings, terms), `components/` (app-shell, rich-text-editor).
- Admin dashboard: `artifacts/admin/src` — served at `/admin/`, muted/denser Pico tone. `pages/` (dashboard, users, user-detail, groups, notifications, content). Super-admin-gated operator console for Nacho.
- Backend: `artifacts/api-server/src/routes` — `recordings.ts` (publish/get/views), `version.ts`, `share.ts` (`/s/:shareId` OG unfurl HTML), `admin.ts` (super-admin-gated: summary, users, roles, groups, impersonation, notifications, ToS editor), `content.ts` (public `/api/tos`). Admin helpers: `lib/clerk.ts` (clerkClient + role helpers), `lib/email.ts` (Resend via connectors proxy), `middlewares/requireSuperAdmin.ts`.
- API contract source of truth: `lib/api-spec/openapi.yaml` → codegen produces hooks + zod in `@workspace/api-client-react`.
- DB schema source of truth: `lib/db/src/schema/` — `recordings.ts` (`published_recordings`), `userGroups.ts` (`user_groups`, `user_group_members`), `tos.ts` (`tos_document`).
- Pico theme tokens: `lib/pico-theme/theme.css` (CSS vars like `--color-card`, `--color-primary`, plus the `--space-*` 4px-grid scale and `--text-*`/`--leading-*` type ramp). `generate-tokens.mjs` emits `spacing` + `typography.scale` into `tokens.json`.
- Figma plugin: `lib/pico-figma-plugin` — no-terminal download. `src/code/` builders: `components.ts` (Pico component sets incl. Logo/Navbar/Footer), `icons.ts` (every lucide-react icon used in code → Figma components on the "Pico / Icons" page), `tokens.ts` (color/radius/shadow/space variables + text styles), `page.ts` (reconstruct a live page). `gen-assets.mjs` scans the codebase at build time → `src/generated/assets.json` (logo SVGs + icon SVGs from `lucide-static`).

## Architecture decisions

- Local-first: all recordings live in IndexedDB (video blob + metadata). Publishing uploads a copy to object storage via presigned PUT, then POSTs metadata to Postgres keyed by `shareId`.
- Recording uses MediaRecorder; screen+camera composites through a canvas (camera PiP ring color read from the `--color-card` Pico token at runtime, not hardcoded). The PiP corner is selectable (4 corners) and read live from a mutable var in the draw loop, so changing it updates both the live preview and the recorded composite.
- Recording is two-phase: `prepareRecording()` acquires the screen/camera/mic streams (user gesture → permission prompts) and builds the live composite preview *before* the user hits record; `prepared.start()` then begins the MediaRecorder, and `prepared.dispose()` releases streams if the user backs out. Studio phases: `setup → ready (live preview) → countdown → recording`. Capture-affecting options (source, mic, system audio) are locked once preview is enabled; "Reconfigure" disposes and returns to setup.
- Transcription via Web Speech API runs during recording and is paused/resumed in lockstep with the recorder so segment timestamps stay aligned. The caption language (BCP-47, picked in setup, list in `lib/languages.ts`) drives `recognition.lang` and is stored on the recording as `captionLang`.
- Description HTML is sanitized with DOMPurify both before publish and again at render in `public-view.tsx` (defense in depth against stored XSS).
- OG unfurl: `api-server` serves `/s/:shareId` server-rendered HTML with meta tags + JS redirect to the SPA `/v/:shareId`; copy-link uses `/s/:shareId`. Nacho previewPath is `/nacho/`.
- Auth: Replit-managed Clerk (`@clerk/react`) gates the app UI only — recordings stay local-first, routes are not per-user. `<ClerkProvider>` wraps everything in `App.tsx`; landing `/` and public `/v/:shareId` are open, while `/studio`, `/library`, `/editor/:id`, `/settings` are wrapped in a `Protected` gate that redirects signed-out visitors to `/sign-in`. Signed-in users hitting `/` are redirected to `/studio`. Sign-in/up live at `/sign-in/*?` and `/sign-up/*?` (Clerk needs the `/*?` wildcard + full `path` incl. base). `api-server` mounts the Clerk proxy (`/api/__clerk`) + `clerkMiddleware`; the proxy/`VITE_CLERK_PROXY_URL` are prod-only (empty in dev). Account delete uses `user.delete()` in Settings; sign-out uses `useClerk().signOut()`.
- Admin: super-admin role lives in Clerk `publicMetadata.role` (`super_admin`); `hello@timrosenberg.com` is a permanent super admin enforced in code (`isPermanentSuperAdmin`), independent of metadata. `requireSuperAdmin` middleware gates all `/api/admin/*` via `getAuth(req)` + role check. User management reads/writes Clerk via `clerkClient` (`@clerk/backend`). Impersonation ("Log in as user") mints a Clerk actor token (`clerkClient.actorTokens.create`) and redirects to `/sign-in?__clerk_ticket=<token>` — works because Nacho is served at root `/` and shares the Clerk session. Groups are DB-backed (`user_group_members` stores Clerk user IDs). Email notifications go through Resend via the connectors proxy (`lib/email.ts`); from-address overridable with `NOTIFICATION_FROM_EMAIL`.
- Terms of Service: single DB row (`tos_document`, id=1), edited in admin Content page, served publicly at `/api/tos` and rendered at Nacho `/terms` (linked in footer). Clerk's legal-consent checkbox at signup is configured in the Clerk Auth pane (not settable via Backend API); point its Terms URL at `/terms`.

## Product

Nacho is a browser-based screen recorder (Loom alternative). Record screen, camera, or both (with PiP), plus mic/system audio. Recordings save locally; edit title/description, trim, add chapters, and review an auto transcript. Publish to get a public share link with OG preview and view counts. Sign up / sign in (Clerk) is required to use the app; the marketing landing page and public shared-recording view stay open to everyone. A separate super-admin dashboard at `/admin/` operates Nacho: usage summary, user management (roles, groups, impersonation), email notifications, and a Terms of Service editor.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
