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

export interface LocalRecording {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  trimStart: number;
  trimEnd: number;
  hasAudio: boolean;
  source: RecordingSource;
  chapters: Chapter[];
  transcript: TranscriptSegment[];
  createdAt: number;
  blob: Blob;
  thumbnail: Blob | null;
  mimeType: string;
  shareId: string | null;
  videoPath: string | null;
  thumbnailPath: string | null;
  gifPath: string | null;
}

export type LocalRecordingMeta = Omit<LocalRecording, "blob">;

export interface PublishResult {
  shareId: string;
  videoPath: string;
  thumbnailPath: string | null;
  gifPath: string | null;
}
