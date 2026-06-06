import { nanoid } from "nanoid";
import { saveRecording, listRecordings } from "@/lib/db";
import { captureThumbnail, getBlobDuration } from "@/lib/media";
import type { Chapter, LocalRecording, TranscriptSegment } from "@/lib/types";

// Dev-only seeding of the local Library with playable sample recordings. Each
// seeded recording is an independent copy of a single real, seekable video, so
// the Library, editor, and publish flows can be exercised with realistic data
// without recording anything.
//
// The ~19MB placeholder video is fetched at runtime from a dev-only Vite
// middleware (see vite.config.ts) rather than imported as an asset, so it is
// never copied into the production bundle. This module itself is only ever
// loaded via a dynamic import behind the dev-auth bypass.
const PLACEHOLDER_VIDEO_URL = `${import.meta.env.BASE_URL}__dev-placeholder-video.webm`;

// How many sample copies to create on auto-seed and on the "Seed samples" button.
const SAMPLE_COUNT = 5;

const SAMPLE_CHAPTERS: Chapter[] = [
  { time: 0, label: "Intro" },
  { time: 1, label: "Highlights" },
];

const SAMPLE_TRANSCRIPT: TranscriptSegment[] = [
  { start: 0, end: 1, text: "Welcome to this sample recording." },
  { start: 1, end: 2, text: "This is dev-only placeholder content." },
];

interface SampleSource {
  blob: Blob;
  mimeType: string;
  duration: number;
  thumbnail: Blob | null;
}

// Fetch the placeholder video once and derive its duration + a thumbnail so the
// per-copy work is just cloning the blob and writing a record.
async function loadSampleSource(): Promise<SampleSource> {
  const res = await fetch(PLACEHOLDER_VIDEO_URL);
  if (!res.ok) {
    throw new Error(`Failed to load placeholder video (${res.status})`);
  }
  const blob = await res.blob();
  const mimeType = blob.type || "video/webm";

  let duration = 0;
  try {
    const measured = await getBlobDuration(blob);
    if (Number.isFinite(measured) && measured > 0) duration = measured;
  } catch {
    /* fall back to 0; cards still render */
  }

  let thumbnail: Blob | null = null;
  try {
    thumbnail = await captureThumbnail(
      blob,
      duration > 0 ? Math.min(0.2, duration / 2) : 0.1,
    );
  } catch {
    thumbnail = null;
  }

  return { blob, mimeType, duration, thumbnail };
}

function buildRecording(source: SampleSource, index: number): LocalRecording {
  // Each record gets its own Blob handle; IndexedDB structured-clones it on save
  // so the stored copies are fully independent.
  const blob = source.blob.slice(0, source.blob.size, source.mimeType);
  const duration = source.duration;

  return {
    id: nanoid(12),
    title: `Sample recording ${index + 1}`,
    description: "<p>Dev-only sample recording for testing.</p>",
    durationSec: duration,
    trimStart: 0,
    trimEnd: duration,
    hasAudio: false,
    source: "screen",
    selfieCorner: null,
    captionLang: null,
    chapters: SAMPLE_CHAPTERS,
    displayChaptersOnVideo: false,
    notifyOnView: false,
    pinned: false,
    transcript: SAMPLE_TRANSCRIPT,
    createdAt: Date.now() + index,
    blob,
    thumbnail: source.thumbnail,
    mimeType: source.mimeType,
    visibility: "private",
    shareId: null,
    videoPath: null,
    thumbnailPath: null,
    gifPath: null,
  };
}

/**
 * Write {@link SAMPLE_COUNT} playable sample recordings into IndexedDB so the
 * Library, editor and publish flows can be exercised without recording anything.
 * Each recording is an independent copy of the same real placeholder video.
 * Returns the number of recordings created.
 */
export async function seedSampleRecordings(): Promise<number> {
  const source = await loadSampleSource();
  let created = 0;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    await saveRecording(buildRecording(source, i));
    created += 1;
  }
  return created;
}

const AUTO_SEED_KEY = "nacho_dev_seeded";

/**
 * Seed sample recordings once per browser profile when the bypass is on and the
 * Library is empty. Guarded by a localStorage flag so deleting all recordings
 * later does not trigger re-seeding. Returns the number created (0 if skipped).
 */
export async function autoSeedIfEmpty(): Promise<number> {
  if (localStorage.getItem(AUTO_SEED_KEY)) return 0;
  const existing = await listRecordings();
  if (existing.length > 0) {
    localStorage.setItem(AUTO_SEED_KEY, "1");
    return 0;
  }
  const created = await seedSampleRecordings();
  localStorage.setItem(AUTO_SEED_KEY, "1");
  return created;
}
