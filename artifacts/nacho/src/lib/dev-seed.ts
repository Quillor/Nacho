import { nanoid } from "nanoid";
import { saveRecording, listRecordings } from "./db";
import { captureThumbnail, getBlobDuration, pickRecorderMimeType } from "./media";
import type { Chapter, LocalRecording, TranscriptSegment } from "./types";

// Dev-only seeding of the local Library with playable sample recordings. This
// module is only ever loaded via a dynamic import behind DEV_AUTH_BYPASS, so it
// is dead-code eliminated from production bundles. Sample clips are generated at
// runtime (canvas → MediaRecorder), producing real, seekable video blobs — no
// binary assets ship with the app.

interface ClipSpec {
  title: string;
  bg: string;
  fg: string;
  durationSec: number;
  chapters: Chapter[];
  transcript: TranscriptSegment[];
}

const SAMPLES: ClipSpec[] = [
  {
    title: "Sample · Product walkthrough",
    bg: "#3b2a18",
    fg: "#f5c518",
    durationSec: 3,
    chapters: [
      { time: 0, label: "Intro" },
      { time: 1.5, label: "Highlights" },
    ],
    transcript: [
      { start: 0, end: 1.5, text: "Welcome to the product walkthrough." },
      { start: 1.5, end: 3, text: "Here are the highlights." },
    ],
  },
  {
    title: "Sample · Quick bug report",
    bg: "#1d2a3a",
    fg: "#7fd1ff",
    durationSec: 2,
    chapters: [],
    transcript: [
      { start: 0, end: 2, text: "Reproducing the bug step by step." },
    ],
  },
  {
    title: "Sample · Team standup",
    bg: "#2a1d2e",
    fg: "#ff9ecb",
    durationSec: 2,
    chapters: [{ time: 0, label: "Updates" }],
    transcript: [{ start: 0, end: 2, text: "Today's standup updates." }],
  },
];

function generateClip(
  spec: ClipSpec,
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas not supported"));
      return;
    }

    const stream = canvas.captureStream(30);
    const mimeType = pickRecorderMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1_000_000,
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error("MediaRecorder failed"));
      return;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    let rafId = 0;
    const start = performance.now();

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      ctx.fillStyle = spec.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const x = canvas.width / 2 + Math.sin(t * 2.2) * 220;
      ctx.fillStyle = spec.fg;
      ctx.beginPath();
      ctx.arc(x, 150, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(spec.title, canvas.width / 2, 300);
      ctx.font = "bold 20px monospace";
      ctx.fillText(`${t.toFixed(1)}s`, canvas.width / 2, 60);
      if (t < spec.durationSec) rafId = requestAnimationFrame(draw);
    };

    recorder.onstop = () => {
      cancelAnimationFrame(rafId);
      stream.getTracks().forEach((track) => track.stop());
      resolve({ blob: new Blob(chunks, { type: mimeType }), mimeType });
    };
    recorder.onerror = () => {
      cancelAnimationFrame(rafId);
      stream.getTracks().forEach((track) => track.stop());
      reject(new Error("Recording failed"));
    };

    recorder.start();
    draw();
    window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, spec.durationSec * 1000 + 200);
  });
}

async function buildRecording(spec: ClipSpec): Promise<LocalRecording> {
  const { blob, mimeType } = await generateClip(spec);
  let duration = spec.durationSec;
  try {
    const measured = await getBlobDuration(blob);
    if (Number.isFinite(measured) && measured > 0) duration = measured;
  } catch {
    /* keep nominal duration */
  }
  let thumbnail: Blob | null = null;
  try {
    thumbnail = await captureThumbnail(blob, Math.min(0.2, duration / 2));
  } catch {
    thumbnail = null;
  }

  return {
    id: nanoid(12),
    title: spec.title,
    description: "<p>Dev-only sample recording for testing.</p>",
    durationSec: duration,
    trimStart: 0,
    trimEnd: duration,
    hasAudio: false,
    source: "screen",
    captionLang: null,
    chapters: spec.chapters,
    displayChaptersOnVideo: false,
    notifyOnView: false,
    transcript: spec.transcript,
    createdAt: Date.now(),
    blob,
    thumbnail,
    mimeType,
    visibility: "private",
    shareId: null,
    videoPath: null,
    thumbnailPath: null,
    gifPath: null,
  };
}

/**
 * Write 3 playable sample recordings into IndexedDB so the Library, editor and
 * publish flows can be exercised without recording anything. Returns the number
 * of recordings created.
 */
export async function seedSampleRecordings(): Promise<number> {
  let created = 0;
  for (const spec of SAMPLES) {
    const recording = await buildRecording(spec);
    await saveRecording(recording);
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
