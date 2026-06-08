# Contributing

How to make changes here without eroding the structure. Read `ARCHITECTURE.md` first for the layout and the "why"; this file is the practical how-to.

## Setup & everyday commands

This is a pnpm workspace (Node 24, TypeScript 5.9). Apps run via Replit workflows, not root `pnpm dev`.

- `pnpm install` — install all workspace deps.
- `pnpm run typecheck` — full typecheck (libs built first, then apps). The canonical check.
- `pnpm run lint` — module-boundary lint (apps must not import apps).
- `pnpm run check-file-size` — 400-line file-size budget (advisory for now).
- `pnpm run check-contrast` — Pico contrast guardrail.
- `pnpm --filter @workspace/pico-ui run check-pico-meta` — Figma-metadata coverage.
- `pnpm --filter @workspace/nacho run test` — Nacho unit tests (Vitest + jsdom), incl. the rich-text editor keyboard regression suite.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod from the OpenAPI spec.

See `replit.md` for running individual apps, the dev auth bypass, and DB/seed commands.

## Golden rules

1. **Apps never import apps.** Shared code goes in a `lib/*` package. (Enforced by `pnpm run lint`.)
2. **Organize by feature, not by file type.** New code lands in `src/features/<feature>/`, not in a giant `components/` or `lib/` bucket. See `ARCHITECTURE.md`.
3. **Keep files under ~400 lines.** Split early; only add an exemption when the file is inherently large (with a reason).
4. **Contract-first for the API.** Change the OpenAPI spec, regenerate, then implement.
5. **Comment the why.** File-header comments for non-obvious modules; JSDoc for everything exported from `lib/*`.

## How to… add a feature to a web app

1. Create `src/features/<feature>/` with `components/`, `hooks/`, `api.ts`, logic files, `types.ts`, and an `index.ts` that exports only the public surface.
2. Put data access in `api.ts`, wrapping the generated hooks from `@workspace/api-client-react`. Keep business logic out of components.
3. Add a thin page/route that composes the feature's components.
4. Import the feature elsewhere only via its `index.ts`.

## How to… add or change an API endpoint

1. Edit the contract: `lib/api-spec/openapi.yaml` (don't change `info.title` — it controls generated filenames).
2. Regenerate: `pnpm --filter @workspace/api-spec run codegen`.
3. Implement in the matching `api-server` domain: a thin handler in `*.routes.ts` that validates with the generated Zod schemas (`@workspace/api-zod`) and delegates to a `*.service.ts`. No business logic in the route file.
4. Use `req.log` for logging — never `console.log` in server code.

## How to… add a shared lib

1. Create `lib/<name>/` with its own `package.json` (name `@workspace/<name>`) and `tsconfig.json` including `composite`, `declarationMap`, `emitDeclarationOnly`.
2. Add it to the root `tsconfig.json` `references`. If it imports another lib, add that to its own `references`.
3. Consume it from apps as `@workspace/<name>`. (See the `pnpm-workspace` skill for details and dependency rules.)

## Pre-merge checklist

Run before opening a change:

- [ ] `pnpm run typecheck` passes.
- [ ] `pnpm run lint` passes (no boundary violations).
- [ ] `pnpm run check-file-size` passes (split or document any new large file).
- [ ] `pnpm run check-contrast` passes (if you touched Pico UI).
- [ ] `pnpm --filter @workspace/pico-ui run check-pico-meta` passes (if you touched `pico-ui`).
- [ ] `pnpm --filter @workspace/nacho run test` passes (if you touched Nacho — esp. the description editor).
- [ ] New code follows the feature-based layout and naming conventions in `ARCHITECTURE.md`.
- [ ] Exported `lib/*` APIs have JSDoc; non-obvious modules have a header comment.
- [ ] If you duplicated cross-app glue (because apps can't import each other), the copies are in sync — or you extracted it into a lib.
