import DOMPurify from "dompurify";
import type { LocalRecording, PublishResult } from "./types";

interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
}

async function uploadBlob(blob: Blob, name: string): Promise<string> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      size: blob.size,
      contentType: blob.type || "application/octet-stream",
    }),
  });
  if (!res.ok) throw new Error("Failed to request upload URL");
  const { uploadURL, objectPath } = (await res.json()) as UploadUrlResponse;

  const put = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  if (!put.ok) throw new Error("Upload failed");
  return objectPath;
}

export interface PublishOptions {
  gifBlob?: Blob | null;
  onProgress?: (label: string) => void;
}

export async function publishRecording(
  rec: LocalRecording,
  options: PublishOptions = {},
): Promise<PublishResult> {
  const { gifBlob, onProgress } = options;
  const ext = rec.mimeType.includes("mp4") ? "mp4" : "webm";

  onProgress?.("Uploading video…");
  const videoPath = await uploadBlob(rec.blob, `${rec.id}.${ext}`);

  let thumbnailPath: string | null = null;
  if (rec.thumbnail) {
    onProgress?.("Uploading thumbnail…");
    thumbnailPath = await uploadBlob(rec.thumbnail, `${rec.id}.jpg`);
  }

  let gifPath: string | null = null;
  if (gifBlob) {
    onProgress?.("Uploading preview…");
    gifPath = await uploadBlob(gifBlob, `${rec.id}.gif`);
  }

  onProgress?.("Creating share link…");
  const res = await fetch("/api/recordings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: rec.title,
      description: DOMPurify.sanitize(rec.description),
      durationSec: rec.durationSec,
      trimStart: rec.trimStart,
      trimEnd: rec.trimEnd,
      hasAudio: rec.hasAudio,
      videoPath,
      thumbnailPath,
      gifPath,
      chapters: rec.chapters,
      transcript: rec.transcript,
    }),
  });
  if (!res.ok) throw new Error("Failed to publish recording");
  const data = (await res.json()) as { shareId: string };

  return { shareId: data.shareId, videoPath, thumbnailPath, gifPath };
}
