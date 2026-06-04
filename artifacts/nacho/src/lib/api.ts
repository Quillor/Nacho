/**
 * Absolute URL to a stored object served by the API server.
 * `objectPath` looks like "/objects/uploads/<id>".
 */
export function storageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

/**
 * Public share link that unfurls with Open Graph metadata.
 * Served by the API server at /s/:shareId.
 */
export function shareUrl(shareId: string): string {
  return `${window.location.origin}/s/${shareId}`;
}

/**
 * In-app route for the public view of a recording.
 * Respects the artifact base path (e.g. /nacho/).
 */
export function publicViewPath(shareId: string): string {
  return `/v/${shareId}`;
}
