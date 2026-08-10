// Recording domain primitives shared with the DB schema live in
// @workspace/shared (single source of truth). Re-exported here so existing
// `@/lib/types` imports keep resolving.
export type {
  Chapter,
  TranscriptSegment,
  Visibility,
  SelfieCorner,
} from "@workspace/shared/types";
import type {
  Chapter,
  TranscriptSegment,
  Visibility,
  SelfieCorner,
} from "@workspace/shared/types";

// --- Nacho-only (local-first) types ---

export type RecordingSource = "screen" | "camera" | "screen-camera";

export type RecordingStatus = "local" | "published";

/**
 * A resumable upload session persisted on the local recording so an
 * interrupted transfer (reload, crash, sleep) resumes from the last committed
 * byte on the next attempt instead of restarting. `size` guards against
 * resuming with a different blob than the session was opened for.
 */
export interface SavedUploadSession {
  sessionUrl: string;
  objectPath: string;
  size: number;
}

export interface LocalRecording {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  trimStart: number;
  trimEnd: number;
  hasAudio: boolean;
  source: RecordingSource;
  /** Corner the selfie bubble sits in (screen+cam only); null = legacy/default. */
  selfieCorner: SelfieCorner | null;
  captionLang: string | null;
  chapters: Chapter[];
  /** When true, the current chapter's title is briefly shown over the video. */
  displayChaptersOnVideo: boolean;
  /** When true, the owner is emailed each time the recording is watched. */
  notifyOnView: boolean;
  /** When true, the recording is pinned to the top of the Library (per-device). */
  pinned: boolean;
  transcript: TranscriptSegment[];
  createdAt: number;
  blob: Blob;
  thumbnail: Blob | null;
  mimeType: string;
  visibility: Visibility;
  shareId: string | null;
  videoPath: string | null;
  thumbnailPath: string | null;
  gifPath: string | null;
  /** In-flight resumable upload session, cleared once the upload completes. */
  uploadSession?: SavedUploadSession | null;
}

export type LocalRecordingMeta = Omit<LocalRecording, "blob">;

/**
 * One row in the Library grid: either a device-local recording or a
 * cloud-only recording that exists on the server but not on this device
 * (recorded elsewhere, or the local copy was cleared). Cloud-only entries
 * carry a `thumbnailUrl` (no local thumbnail blob) and can be watched,
 * shared, and deleted — but not edited, since editing needs the local media.
 */
export interface LibraryItem extends LocalRecordingMeta {
  /** True when this recording exists only on the server. */
  remote?: boolean;
  /** Server thumbnail URL for cloud-only entries. */
  thumbnailUrl?: string | null;
  /** Server upload status for cloud-only entries ("pending" = still uploading). */
  remoteStatus?: "pending" | "ready";
}

export interface PublishResult {
  shareId: string;
  visibility: Visibility;
  videoPath: string;
  thumbnailPath: string | null;
  gifPath: string | null;
}
