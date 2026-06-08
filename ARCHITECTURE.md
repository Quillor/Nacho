# Architecture

This document is the committed home for the Nacho monorepo's structure, conventions, and the "why" behind its key decisions. `replit.md` covers how to run and operate the project; this file covers how it is organized and why. Deeper, evolving notes live in `.agents/memory/` and are referenced inline.

> **Status note.** The repo is mid-migration to a feature-based layout. This document describes the **target** structure. Files that don't match it yet are tracked by the reorganization tasks and by the `check-file-size` allowlist. New code should follow the target structure from day one.

## The big picture

```text
artifacts/        # Deployable applications (apps). Never import each other.
  nacho/          #   Browser screen recorder (the product)
  admin/          #   Super-admin operator console (/admin/)
  pico/           #   Pico design-system documentation site
  api-server/     #   Express API + server-rendered share/unfurl + render
  mockup-sandbox/ #   Scaffolded component-preview harness (tooling, not product)
lib/              # Shared libraries. The ONLY way apps share code.
  pico-ui/        #   Pico React component library (shadcn-derived)
  pico-theme/     #   Design tokens (theme.css + tokens.json) — single source of truth
  db/             #   Drizzle schema + client
  api-spec/       #   OpenAPI contract (source of truth for the API)
  api-client-react/, api-zod/  #   Generated hooks + Zod schemas (from api-spec)
  nacho-illustrations/         #   Shared image assets
  pico-figma-plugin/           #   Figma plugin builders + packer
scripts/          # Repo-wide utility + guardrail scripts (@workspace/scripts)
```

See the `pnpm-workspace` skill / `.local/skills/pnpm-workspace` for workspace mechanics (TypeScript project references, codegen, package rules).

## Module boundaries (the load-bearing rule)

**Apps must not import each other.** Apps are leaf packages, not importable libraries. Anything two apps both need must be extracted into a `lib/*` package. This is enforced by ESLint (`eslint.config.mjs`, `boundaries/element-types`):

- `app` → may import `lib/*` and its own files.
- `lib` → may import other `lib/*`.
- `scripts` → may import `lib/*` and `scripts`.

This is why some glue (dev-auth helpers, formatters) is currently **duplicated** across `nacho` and `admin` — they cannot import each other today. The reorganization extracts that shared glue into a lib; until then, keep the duplicated copies in sync.

## Target structure: feature-based

### Web apps (`nacho`, `admin`, `pico`)

Organize by **feature/domain**, not by technical type. A feature owns its UI, hooks, data access, and logic, and exposes a small public surface via `index.ts`.

```text
src/
  features/
    <feature>/
      components/        # feature-scoped UI
      hooks/             # feature-scoped hooks
      api.ts             # data access (wraps the generated @workspace/api-client-react hooks)
      <feature>.ts       # business logic / pure helpers
      types.ts           # feature-local types
      index.ts           # public surface — other modules import from here
  components/            # cross-feature app-shared UI (prefer @workspace/pico-ui first)
  lib/                   # genuinely global utilities/config for this app only
  pages/ (or routes/)    # thin route entries that compose features
  App.tsx, main.tsx
```

Rules of thumb:
- A **page** is thin: it wires routing and composes feature components. Business logic lives in the feature, not the page.
- Import across features only through a feature's `index.ts`, never deep into its internals.
- Reach for `@workspace/pico-ui` before writing a new shared component.

### API server (`api-server`)

Organize by **domain** with a thin route layer over a service layer:

```text
src/
  features/<domain>/
    <domain>.routes.ts   # thin Express handlers: validate input (Zod), call service, respond
    <domain>.service.ts  # business logic: DB, Clerk, email, object storage
    <domain>.types.ts
  lib/                   # infrastructure: clerk, email, objectStorage, logger
  middlewares/
  app.ts / index.ts      # mounts the feature routers
```

Rules of thumb:
- Handlers stay thin — parse/validate with the Zod schemas from `@workspace/api-zod`, delegate to a service, shape the response. No business logic in route files.
- Validate request **and** response against the OpenAPI-derived Zod schemas.
- Never `console.log` in server code — use `req.log` in handlers and the singleton `logger` elsewhere (see the `pnpm-workspace` server reference).

## Conventions

### Naming
- **Filenames: `kebab-case`** for all `.ts`/`.tsx` (e.g. `video-player.tsx`, `dev-auth.ts`). React component files are kebab-case too (the component export stays `PascalCase`).
- **Known deviation:** `api-server` currently uses `camelCase` filenames (`devAuth.ts`, `objectStorage.ts`). These are realigned to kebab-case during the API-server reorganization. New files there should already be kebab-case.
- Feature folders are `kebab-case`, singular where it reads naturally (e.g. `recording/`, `auth/`, `notifications/`).

### Comments & annotations
The goal is that a future contributor can update any area safely. Optimize comments for **why**, not **what**.
- Add a short **file-header comment** to any non-obvious module explaining its purpose and key constraints. The guardrail scripts (`scripts/src/check-contrast.ts`, `lib/pico-ui/scripts/check-pico-meta.mjs`) are the reference style.
- **JSDoc every exported function/type in `lib/*`** — these are public APIs consumed across apps.
- Annotate non-obvious decisions inline with a brief "why" (and a pointer to the relevant `.agents/memory/` note when one exists). Don't restate what the code already says.

### File-size budget
- Soft cap: **400 lines** for any `.ts`/`.tsx` under `artifacts/*` or `lib/*`.
- Over budget → split into focused modules, **or** record an exemption in `scripts/src/check-file-size.ts`:
  - `PERMANENT_EXEMPTIONS` — inherently large (generated data, vendored components, code-gen builders), with a reason.
  - `LEGACY_ALLOWLIST` — temporary; the owning reorganization task splits the file and deletes the entry. This list only shrinks.
- Run with `pnpm run check-file-size`. Advisory today; becomes blocking once the allowlist is empty (final reorganization step).

## Automated guardrails

| Command | What it protects |
| --- | --- |
| `pnpm run typecheck` | Types across all packages (libs built first, then leaf apps). |
| `pnpm run lint` | Module boundaries (apps don't import apps) via ESLint. |
| `pnpm run check-file-size` | The 400-line file-size budget (advisory for now). |
| `pnpm run check-contrast` | No low-contrast `text-primary` on light Pico surfaces. |
| `pnpm --filter @workspace/pico-ui run check-pico-meta` | Every Pico component stamps Figma-readable metadata. |

`build` runs contrast + typecheck today. `lint` and `check-file-size` are run on demand now and are wired into the build in the final reorganization step (once the legacy allowlist is empty), so they don't block the in-progress migration.

## Architecture decisions

The durable "why" behind the system. Each entry points to a deeper note in `.agents/memory/` where one exists.

### Product shape
- **Local-first recordings.** All recordings live in the browser (IndexedDB: video blob + metadata). Publishing uploads a copy to object storage via presigned PUT, then POSTs metadata to Postgres keyed by `shareId`. Editing a published recording must PATCH the server copy; trim is metadata-only and only re-uploads the GIF preview. → `recording-publish-sync.md`
- **Two-phase recording.** Streams are acquired on an explicit user gesture to build a live composite preview *before* recording starts; capture-affecting options lock once preview is on, while cosmetic options (PiP corner, caption language) update live. → `recorder-two-phase.md`
- **WebM duration quirk.** Recorded WebM blobs report `duration = Infinity`; resolve via a finite check, then the stored `durationSec`, then a seek-past-end workaround. → `webm-infinity-duration.md`
- **View counting.** A view (count + notify-on-view email) registers only on actual playback start, not page load, deduped once per session. → `view-count-trigger.md`
- **Description editor.** Recording descriptions use a TipTap WYSIWYG editor that outputs HTML; sanitized with DOMPurify before publish and again at render (defense in depth). → `description-editor-tiptap.md`

### Auth & admin
- **Clerk gates the UI only.** Recordings stay local-first; routes aren't per-user. Server checks use `getAuth(req)` (works in dev too); mutations are owner-gated, public reads stay open, requests send `credentials: "include"`. → `clerk-server-auth.md`
- **Display name.** First/last name are disabled in this Clerk instance; the editable display name lives in `unsafeMetadata.displayName` (read via `getDisplayName()`). → `clerk-name-attribute.md`
- **Impersonation.** "Log in as user" mints a Clerk actor token and redirects to `/sign-in?__clerk_ticket=…`; works because the app shares the Clerk session at root. → `clerk-impersonation.md`
- **Legal consent.** Signup ToS consent is managed in the Clerk Auth pane, not settable via the Backend API; the app provides `/terms` and the toggle is surfaced to the operator. → `clerk-legal-consent.md`
- **Email.** Notifications go through Resend via the connectors proxy; a green "INSTALLED" header only means the npm package is present — a proxy `401 "No connection found"` means the integration still needs proposing. → `resend-connector-binding.md`
- **Dev auth bypass** (development only) is documented in `replit.md`.

### Design system & Figma
- **Single source of design truth.** `@workspace/pico-theme/theme.css` defines all tokens; every artifact imports it so edits propagate. → `pico-shared-theme.md`
- **Contrast rule.** Never `text-primary` (yellow) on cream/light surfaces; yellow is a fill (`bg-primary` + brown text); readable text on light is `text-foreground`. Enforced by `check-contrast`. → `pico-contrast-rules.md`
- **Casing.** Headlines are sentence case; uppercase only for small labels, nav, badges, CTA buttons, and the `Pico.` wordmark. → `pico-casing.md`
- **Semantic token groups.** Tokens are grouped into usage families with paired Figma names; dark-mode yellow needs `*-foreground`. → `pico-semantic-token-groups.md`
- **Figma-readable instrumentation.** `picoMeta()` stamps `data-pico-*` attributes; the names are the plugin contract; `tokens.json` derives from `theme.css`. → `figma-readable-instrumentation.md`, `figma-export-coverage.md`, `landing-page-figma-fidelity.md`
- **Figma plugin internals.** Code and UI sides typecheck separately (figma `fetch` vs DOM `fetch`); the page reader uses the delivered HTML (no headless browser in-plugin) with an SSRF-guarded `/api/render` companion that uses Nix Chromium in deployment and fails loud on unreadable URLs. → `figma-plugin-tsconfig.md`, `figma-plugin-page-reader.md`, `figma-plugin-page-from-url.md`, `figma-plugin-download.md`

### Platform / build
- **Nacho base path.** Nacho is served at `/` (not `/nacho/`); share/unfurl URLs use `/v/:shareId`, and `/s/:shareId` unfurl HTML is served by `api-server`. → `nacho-base-path.md`
- **Shared illustrations.** `@workspace/nacho-illustrations` is assets-only (no TS); import WebP images by path, shared across artifacts. → `nacho-illustrations-lib.md`
- **Dev-only large assets.** `?url` asset imports in dynamically-imported dev-only modules still ship to prod; serve them via an `apply: "serve"` Vite plugin middleware + runtime fetch instead. → `vite-dev-only-assets.md`

## Pointers
- `replit.md` — run/operate commands, stack, dev auth bypass, product summary.
- `CONTRIBUTING.md` — how to add a feature, endpoint, or lib, plus the pre-merge checklist.
- `.agents/memory/` — the deeper, evolving notes referenced above.
- `pnpm-workspace` skill — workspace mechanics and codegen.
