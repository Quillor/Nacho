import { apiOrigin } from "./desktop-api";

/**
 * Absolute URL to a stored object served by the API server.
 * `objectPath` looks like "/objects/uploads/<id>". On desktop this points at the
 * configured backend; on the web it stays same-origin.
 */
export function storageUrl(objectPath: string): string {
  return `${apiOrigin}/api/storage${objectPath}`;
}

/**
 * Public share link that unfurls with Open Graph metadata.
 * Served by the API server at /s/:shareId. On desktop this uses the backend
 * origin so the link is publicly shareable, not the local app origin.
 */
export function shareUrl(shareId: string): string {
  const origin = apiOrigin || window.location.origin;
  return `${origin}/s/${shareId}`;
}

/**
 * In-app route for the public view of a recording.
 * Respects the artifact base path (e.g. /nacho/).
 */
export function publicViewPath(shareId: string): string {
  return `/v/${shareId}`;
}
