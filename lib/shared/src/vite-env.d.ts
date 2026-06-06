// Ambient typings so this lib type-checks on its own (`tsc --build`) without
// depending on `vite/client`. Vite apps that consume this lib provide their own
// `import.meta.env` types via `vite/client`; these declarations are only loaded
// when compiling this package in isolation and never leak into consumers.
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_DEV_AUTH_BYPASS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
