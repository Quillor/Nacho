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
  captionLang: string | null;
  chapters: Chapter[];
  /** When true, the current chapter's title is briefly shown over the video. */
  displayChaptersOnVideo: boolean;
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
