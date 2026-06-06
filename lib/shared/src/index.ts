// Public barrel for browser (app) consumers. Re-exports the dev-auth client
// helpers, formatting helpers, and shared domain types.
//
// Non-browser consumers (the API server, the DB schema) must NOT import this
// barrel — it pulls in browser-only code (import.meta / DOM). They import the
// narrow subpaths instead: `@workspace/shared/dev-auth-constants` and
// `@workspace/shared/types`.
export * from "./dev-auth/dev-auth";
export * from "./format";
export * from "./types";
