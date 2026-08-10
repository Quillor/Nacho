// "Download footage" — hands the user the combined recording file (the
// composite already bakes in screen, camera bubble, cursor and click effects)
// plus YouTube-ready caption files (.srt and .vtt) built from the transcript.

import { getRecording } from "@/lib/db";
import { apiPath, authHeaders } from "@/lib/desktop-api";
import type { LibraryItem, TranscriptSegment } from "@/lib/types";

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function formatClock(totalSec: number, msSeparator: string): string {
  const clamped = Math.max(0, totalSec);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${msSeparator}${pad(ms, 3)}`;
}

/** SubRip captions (what YouTube's caption upload expects). */
export function transcriptToSrt(segments: TranscriptSegment[]): string {
  return segments
    .map(
      (seg, i) =>
        `${i + 1}\n${formatClock(seg.start, ",")} --> ${formatClock(seg.end, ",")}\n${seg.text}\n`,
    )
    .join("\n");
}

/** WebVTT captions (native <track> format; also accepted by YouTube). */
export function transcriptToVtt(segments: TranscriptSegment[]): string {
  const cues = segments
    .map(
      (seg) =>
        `${formatClock(seg.start, ".")} --> ${formatClock(seg.end, ".")}\n${seg.text}\n`,
    )
    .join("\n");
  return `WEBVTT\n\n${cues}`;
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "recording";
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Download everything for a recording: the combined video file plus .srt and
 * .vtt caption files when a transcript exists. Works for device-local
 * recordings (blob from IndexedDB) and cloud-only ones (signed attachment URL
 * from the server).
 */
export async function downloadRecordingFiles(item: LibraryItem): Promise<void> {
  const base = slugify(item.title);
  let transcript: TranscriptSegment[] = item.transcript ?? [];
  const objectUrls: string[] = [];

  try {
    if (!item.remote) {
      const full = await getRecording(item.id);
      if (!full) throw new Error("Recording not found on this device");
      transcript = full.transcript;
      const ext = full.mimeType.includes("mp4") ? "mp4" : "webm";
      const url = URL.createObjectURL(full.blob);
      objectUrls.push(url);
      triggerDownload(url, `${base}.${ext}`);
    } else if (item.shareId) {
      // Cloud-only: ask the server for a signed attachment URL (it bakes the
      // filename + extension into the object's content-disposition).
      const res = await fetch(
        apiPath(`/api/recordings/${item.shareId}/play?download=1`),
        { credentials: "include", headers: { ...(await authHeaders()) } },
      );
      if (!res.ok) throw new Error("Couldn't prepare the download");
      const { url } = (await res.json()) as { url: string };
      triggerDownload(url, base);

      // The listing summary doesn't carry the transcript — fetch the full
      // recording for the caption files.
      const recRes = await fetch(apiPath(`/api/recordings/${item.shareId}`), {
        credentials: "include",
        headers: { ...(await authHeaders()) },
      });
      if (recRes.ok) {
        const rec = (await recRes.json()) as {
          transcript?: TranscriptSegment[];
        };
        transcript = rec.transcript ?? [];
      }
    } else {
      throw new Error("Recording not found");
    }

    if (transcript.length > 0) {
      // Stagger sibling downloads slightly — some browsers drop rapid-fire
      // programmatic download clicks from a single gesture.
      await delay(400);
      const srtUrl = URL.createObjectURL(
        new Blob([transcriptToSrt(transcript)], { type: "text/plain" }),
      );
      objectUrls.push(srtUrl);
      triggerDownload(srtUrl, `${base}.srt`);

      await delay(400);
      const vttUrl = URL.createObjectURL(
        new Blob([transcriptToVtt(transcript)], { type: "text/vtt" }),
      );
      objectUrls.push(vttUrl);
      triggerDownload(vttUrl, `${base}.vtt`);
    }
  } finally {
    // Give the browser time to begin the transfers before revoking.
    setTimeout(() => {
      for (const url of objectUrls) URL.revokeObjectURL(url);
    }, 60_000);
  }
}
