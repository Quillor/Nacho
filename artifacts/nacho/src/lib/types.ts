export interface Chapter {
  time: number;
  label: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export type RecordingSource = "screen" | "camera" | "screen-camera";

/** Which corner the camera bubble (selfie) sits in for a screen+cam recording. */
export type SelfieCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type RecordingStatus = "local" | "published";

/** Whether a recording has a resolvable public share link. Saved videos are
 * private by default; a public link is generated only on demand. */
export type Visibility = "private" | "public";

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
