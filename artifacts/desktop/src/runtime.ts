// Runtime-resolved renderer origin (e.g. http://localhost:17653 in a packaged
// build, or the Vite dev server URL in development). Set once at startup in the
// main process; read by the window factory when composing URLs.
let rendererOrigin = "";

export function setRendererOrigin(origin: string): void {
  rendererOrigin = origin.replace(/\/$/, "");
}

export function getRendererOrigin(): string {
  return rendererOrigin;
}
