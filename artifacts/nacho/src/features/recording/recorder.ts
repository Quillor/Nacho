import type { RecordingSource, SelfieCorner } from "@/lib/types";
import { pickRecorderMimeType } from "@/lib/media";
import { drawCameraBubble } from "./composite";
import {
  type CursorInput,
  type Ripple,
  type Point,
  mapToCanvas,
  drawCursor,
  drawRipples,
  createClickBuffer,
  playClick,
} from "./cursor-overlay";

export type { SelfieCorner } from "@/lib/types";
export type { CursorInput } from "./cursor-overlay";

export interface RecorderOptions {
  source: RecordingSource;
  withMic: boolean;
  withSystemAudio: boolean;
  corner?: SelfieCorner;
  /**
   * Cursor controls (desktop only). When `cursorOverlay` is on, the native OS
   * cursor is hidden from capture and an enlarged synthetic cursor is drawn onto
   * the recorded canvas. `clickSound`/`clickRipple` add an embedded click sound
   * and an on-canvas ripple. `cursorInput` is the host-supplied live cursor
   * position + captured-display bounds. All optional → web behavior unchanged.
   */
  cursorOverlay?: boolean;
  cursorSize?: number;
  clickSound?: boolean;
  clickRipple?: boolean;
  cursorInput?: CursorInput;
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
  /** Register a global click: plays the click sound and spawns a ripple. */
  triggerClick(): void;
}

export interface PreparedRecorder {
  /** Live composite stream suitable for an on-screen <video> preview. */
  previewStream: MediaStream;
  hasAudio: boolean;
  /** Whether a selfie bubble corner control is meaningful for this source. */
  hasSelfie: boolean;
  /** Move the camera bubble live (affects both preview and the recording). */
  setCorner(corner: SelfieCorner): void;
  /** Register a global click during preview (ripple only; no recording yet). */
  triggerClick(): void;
  /** Begin capturing. Returns the active recorder controller. */
  start(): RecorderController;
  /** Release all streams without recording (used when the user backs out). */
  dispose(): void;
}

function mixAudio(
  streams: MediaStream[],
  force: boolean,
): {
  track: MediaStreamTrack | null;
  ctx: AudioContext | null;
  dest: MediaStreamAudioDestinationNode | null;
} {
  const withAudio = streams.filter((s) => s.getAudioTracks().length > 0);
  // Without inputs and without a forced destination, behave exactly as before:
  // no AudioContext is created.
  if (withAudio.length === 0 && !force) {
    return { track: null, ctx: null, dest: null };
  }
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  for (const s of withAudio) {
    const src = ctx.createMediaStreamSource(
      new MediaStream(s.getAudioTracks()),
    );
    src.connect(dest);
  }
  return { track: dest.stream.getAudioTracks()[0] ?? null, ctx, dest };
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

/**
 * Acquire the screen/camera/mic streams and build the live composite preview,
 * but do not start the MediaRecorder yet. This lets Studio show what's being
 * captured (and let the user pick the selfie corner) before recording begins.
 */
export async function prepareRecording(
  opts: RecorderOptions,
): Promise<PreparedRecorder> {
  // Cursor overlay only applies when the screen is part of the capture.
  const cursorActive =
    Boolean(opts.cursorOverlay) &&
    (opts.source === "screen" || opts.source === "screen-camera");

  const acquired: MediaStream[] = [];
  let screenStream: MediaStream | undefined;
  let cameraStream: MediaStream | undefined;
  let micStream: MediaStream | undefined;

  try {
    if (opts.source === "screen" || opts.source === "screen-camera") {
      const videoConstraints: MediaTrackConstraints = { frameRate: 30 };
      // Hide the OS cursor from capture so we can draw our enlarged one.
      if (cursorActive) {
        (videoConstraints as { cursor?: string }).cursor = "never";
      }
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
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
  // Force an audio destination when click sound is on, so clicks have a track
  // to ride even if there's no mic/system audio.
  const {
    track: audioTrack,
    ctx: audioCtx,
    dest: audioDest,
  } = mixAudio(audioSources, Boolean(opts.clickSound));

  // Click sound buffer (synthesized once).
  const clickBuffer =
    opts.clickSound && audioCtx ? createClickBuffer(audioCtx) : null;
  const ripples: Ripple[] = [];
  let lastCursorCanvas: Point | null = null;

  // A canvas is needed for the camera bubble composite OR the cursor overlay.
  const useCanvas =
    (opts.source === "screen-camera" && Boolean(screenStream && cameraStream)) ||
    (cursorActive && Boolean(screenStream));

  let videoTrack: MediaStreamTrack;
  let rafId = 0;
  let canvas: HTMLCanvasElement | null = null;
  let corner: SelfieCorner = opts.corner ?? "bottom-right";
  const helperVideos: HTMLVideoElement[] = [];
  const hasSelfie = opts.source === "screen-camera";

  if (useCanvas && screenStream) {
    const screenVideo = attachVideo(screenStream);
    helperVideos.push(screenVideo);
    const cameraVideo =
      opts.source === "screen-camera" && cameraStream
        ? attachVideo(cameraStream)
        : null;
    if (cameraVideo) helperVideos.push(cameraVideo);

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
    const pxScale = canvas.height / 720;
    const cursorScale = (opts.cursorSize ?? 1.5) * pxScale;

    const draw = () => {
      if (!canvas) return;
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      if (cameraVideo) {
        drawCameraBubble(
          ctx,
          cameraVideo,
          canvas.width,
          canvas.height,
          corner,
          ringColor,
        );
      }

      if (cursorActive) {
        if (ripples.length) {
          ripples.splice(
            0,
            ripples.length,
            ...drawRipples(ctx, ripples, performance.now(), pxScale),
          );
        }
        const point = opts.cursorInput?.getPoint() ?? null;
        const bounds = opts.cursorInput?.getDisplayBounds() ?? null;
        const mapped = point
          ? mapToCanvas(point, bounds, canvas.width, canvas.height)
          : null;
        lastCursorCanvas = mapped;
        if (mapped) drawCursor(ctx, mapped.x, mapped.y, cursorScale);
      }

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

  // Plays the click sound (if enabled) and spawns a ripple (if enabled) at the
  // last known cursor position on the canvas.
  const triggerClick = () => {
    if (opts.clickSound && audioCtx && audioDest && clickBuffer) {
      playClick(audioCtx, audioDest, clickBuffer);
    }
    if (opts.clickRipple && cursorActive && lastCursorCanvas) {
      ripples.push({
        x: lastCursorCanvas.x,
        y: lastCursorCanvas.y,
        start: performance.now(),
      });
    }
  };

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
    triggerClick,
    dispose() {
      if (started) return;
      cleanup();
    },
    start(): RecorderController {
      started = true;
      // Resume the audio graph in case the platform suspended it.
      if (audioCtx) void audioCtx.resume().catch(() => undefined);
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
        triggerClick,
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
