import type { RecordingSource, SelfieCorner } from "./types";
import { pickRecorderMimeType } from "./media";

export type { SelfieCorner } from "./types";

export interface RecorderOptions {
  source: RecordingSource;
  withMic: boolean;
  withSystemAudio: boolean;
  corner?: SelfieCorner;
}

export interface RecorderController {
  previewStream: MediaStream;
  mimeType: string;
  hasAudio: boolean;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  getElapsed(): number;
  stop(): Promise<Blob>;
  cancel(): void;
  onEnded(cb: () => void): void;
}

export interface PreparedRecorder {
  /** Live composite stream suitable for an on-screen <video> preview. */
  previewStream: MediaStream;
  hasAudio: boolean;
  /** Whether a selfie bubble corner control is meaningful for this source. */
  hasSelfie: boolean;
  /** Move the camera bubble live (affects both preview and the recording). */
  setCorner(corner: SelfieCorner): void;
  /** Begin capturing. Returns the active recorder controller. */
  start(): RecorderController;
  /** Release all streams without recording (used when the user backs out). */
  dispose(): void;
}

function mixAudio(streams: MediaStream[]): {
  track: MediaStreamTrack | null;
  ctx: AudioContext | null;
} {
  const withAudio = streams.filter((s) => s.getAudioTracks().length > 0);
  if (withAudio.length === 0) return { track: null, ctx: null };
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  for (const s of withAudio) {
    const src = ctx.createMediaStreamSource(
      new MediaStream(s.getAudioTracks()),
    );
    src.connect(dest);
  }
  return { track: dest.stream.getAudioTracks()[0] ?? null, ctx };
}

function cssToken(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

function attachVideo(stream: MediaStream): HTMLVideoElement {
  const v = document.createElement("video");
  v.srcObject = stream;
  v.muted = true;
  v.playsInline = true;
  void v.play().catch(() => undefined);
  return v;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const vw = video.videoWidth || dw;
  const vh = video.videoHeight || dh;
  const scale = Math.max(dw / vw, dh / vh);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Acquire the screen/camera/mic streams and build the live composite preview,
 * but do not start the MediaRecorder yet. This lets Studio show what's being
 * captured (and let the user pick the selfie corner) before recording begins.
 */
export async function prepareRecording(
  opts: RecorderOptions,
): Promise<PreparedRecorder> {
  const acquired: MediaStream[] = [];
  let screenStream: MediaStream | undefined;
  let cameraStream: MediaStream | undefined;
  let micStream: MediaStream | undefined;

  try {
    if (opts.source === "screen" || opts.source === "screen-camera") {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: opts.withSystemAudio,
      });
      acquired.push(screenStream);
    }
    if (opts.source === "camera" || opts.source === "screen-camera") {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      acquired.push(cameraStream);
    }
    if (opts.withMic) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      acquired.push(micStream);
    }
  } catch (err) {
    for (const s of acquired) s.getTracks().forEach((t) => t.stop());
    throw err;
  }

  const audioSources: MediaStream[] = [];
  if (screenStream && opts.withSystemAudio) audioSources.push(screenStream);
  if (micStream) audioSources.push(micStream);
  const { track: audioTrack, ctx: audioCtx } = mixAudio(audioSources);

  let videoTrack: MediaStreamTrack;
  let rafId = 0;
  let canvas: HTMLCanvasElement | null = null;
  let corner: SelfieCorner = opts.corner ?? "bottom-right";
  const helperVideos: HTMLVideoElement[] = [];
  const hasSelfie = opts.source === "screen-camera";

  if (opts.source === "screen-camera" && screenStream && cameraStream) {
    const screenVideo = attachVideo(screenStream);
    const cameraVideo = attachVideo(cameraStream);
    helperVideos.push(screenVideo, cameraVideo);
    canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const settings = screenStream.getVideoTracks()[0]?.getSettings();
    if (settings?.width && settings?.height) {
      canvas.width = settings.width;
      canvas.height = settings.height;
    }
    const ctx = canvas.getContext("2d")!;
    const ringColor = cssToken("--color-card", "hsl(47 43% 94%)");
    const draw = () => {
      if (!canvas) return;
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
      const size = Math.round(canvas.height * 0.26);
      const margin = Math.round(canvas.height * 0.03);
      const right = canvas.width - size - margin;
      const bottom = canvas.height - size - margin;
      const cx = corner === "top-left" || corner === "bottom-left"
        ? margin
        : right;
      const cy = corner === "top-left" || corner === "top-right"
        ? margin
        : bottom;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx + size / 2, cy + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      drawCover(ctx, cameraVideo, cx, cy, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx + size / 2, cy + size / 2, size / 2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(3, size * 0.02);
      ctx.strokeStyle = ringColor;
      ctx.stroke();
      rafId = requestAnimationFrame(draw);
    };
    draw();
    videoTrack = canvas.captureStream(30).getVideoTracks()[0];
  } else {
    const primary = screenStream ?? cameraStream;
    videoTrack = primary!.getVideoTracks()[0];
  }

  const recordTracks: MediaStreamTrack[] = [videoTrack];
  if (audioTrack) recordTracks.push(audioTrack);
  const recordStream = new MediaStream(recordTracks);
  const previewStream = new MediaStream([videoTrack]);

  const cleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    helperVideos.forEach((v) => {
      v.pause();
      v.srcObject = null;
    });
    for (const s of acquired) s.getTracks().forEach((t) => t.stop());
    videoTrack.stop();
    if (audioTrack) audioTrack.stop();
    if (audioCtx) void audioCtx.close().catch(() => undefined);
  };

  let started = false;

  return {
    previewStream,
    hasAudio: Boolean(audioTrack),
    hasSelfie,
    setCorner(next) {
      corner = next;
    },
    dispose() {
      if (started) return;
      cleanup();
    },
    start(): RecorderController {
      started = true;
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(recordStream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.start(1000);

      let startTime = performance.now();
      let accumulated = 0;
      let paused = false;
      let endedCb: (() => void) | null = null;

      const screenTrack = screenStream?.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.addEventListener("ended", () => {
          if (endedCb) endedCb();
        });
      }

      return {
        previewStream,
        mimeType,
        hasAudio: Boolean(audioTrack),
        pause() {
          if (paused || recorder.state !== "recording") return;
          recorder.pause();
          accumulated += performance.now() - startTime;
          paused = true;
        },
        resume() {
          if (!paused) return;
          recorder.resume();
          startTime = performance.now();
          paused = false;
        },
        isPaused() {
          return paused;
        },
        getElapsed() {
          const live = paused ? 0 : performance.now() - startTime;
          return (accumulated + live) / 1000;
        },
        stop() {
          return new Promise<Blob>((resolve) => {
            recorder.onstop = () => {
              cleanup();
              resolve(new Blob(chunks, { type: mimeType }));
            };
            if (recorder.state !== "inactive") recorder.stop();
            else {
              cleanup();
              resolve(new Blob(chunks, { type: mimeType }));
            }
          });
        },
        cancel() {
          try {
            if (recorder.state !== "inactive") recorder.stop();
          } catch {
            /* ignore */
          }
          cleanup();
        },
        onEnded(cb) {
          endedCb = cb;
        },
      };
    },
  };
}
