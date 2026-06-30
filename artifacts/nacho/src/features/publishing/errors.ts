/**
 * The video transfer to object storage failed (request-url or the PUT itself,
 * after retries). The recording is still safe locally — the publish can be
 * retried. Kept distinct from {@link SaveFailedError} so the UI can tell the
 * user *which* half broke instead of a catch-all "couldn't create link".
 */
export class UploadFailedError extends Error {
  constructor(message = "Upload failed") {
    super(message);
    this.name = "UploadFailedError";
  }
}

/**
 * The media uploaded but the server refused to (or couldn't) save the
 * recording row — e.g. it verified the stored object was incomplete (HTTP 422)
 * or the metadata POST failed. Also retryable.
 */
export class SaveFailedError extends Error {
  constructor(message = "Save failed") {
    super(message);
    this.name = "SaveFailedError";
  }
}
