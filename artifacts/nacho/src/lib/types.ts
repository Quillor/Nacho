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
}

export type LocalRecordingMeta = Omit<LocalRecording, "blob">;

export interface PublishResult {
  shareId: string;
  visibility: Visibility;
  videoPath: string;
  thumbnailPath: string | null;
  gifPath: string | null;
}
