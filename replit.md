# Pico Design System

A single-page design system documentation site for "Pico" — a bold, playful, high-contrast brand system (golden yellow, deep brown, cream) covering spacing, typography, color palette, color combinations, and common components.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Nacho recorder app: `artifacts/nacho/src` — `lib/` (recorder, transcribe, gif, publish, db IndexedDB, api helpers), `pages/` (home, studio, library, editor, public-view, settings), `components/` (app-shell, rich-text-editor).
- Backend: `artifacts/api-server/src/routes` — `recordings.ts` (publish/get/views), `version.ts`, `share.ts` (`/s/:shareId` OG unfurl HTML).
- API contract source of truth: `lib/api-spec/openapi.yaml` → codegen produces hooks + zod in `@workspace/api-client-react`.
- DB schema source of truth: `lib/db/src/schema/recordings.ts` (`published_recordings`).
- Pico theme tokens: `lib/pico-theme/theme.css` (CSS vars like `--color-card`, `--color-primary`).

## Architecture decisions

- Local-first: all recordings live in IndexedDB (video blob + metadata). Publishing uploads a copy to object storage via presigned PUT, then POSTs metadata to Postgres keyed by `shareId`.
- Recording uses MediaRecorder; screen+camera composites through a canvas (camera PiP ring color read from the `--color-card` Pico token at runtime, not hardcoded).
- Transcription via Web Speech API runs during recording and is paused/resumed in lockstep with the recorder so segment timestamps stay aligned.
- Description HTML is sanitized with DOMPurify both before publish and again at render in `public-view.tsx` (defense in depth against stored XSS).
- OG unfurl: `api-server` serves `/s/:shareId` server-rendered HTML with meta tags + JS redirect to the SPA `/v/:shareId`; copy-link uses `/s/:shareId`. Nacho previewPath is `/nacho/`.

## Product

Nacho is a browser-based screen recorder (Loom alternative). Record screen, camera, or both (with PiP), plus mic/system audio. Recordings save locally; edit title/description, trim, add chapters, and review an auto transcript. Publish to get a public share link with OG preview and view counts. No login required.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
