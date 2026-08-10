/**
 * Load a video blob into an off-DOM <video> element with its metadata ready.
 * The caller is responsible for revoking the returned objectUrl.
 */
export function loadVideoElement(
  blob: Blob,
): Promise<{ video: HTMLVideoElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;
    const onError = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load video"));
    };
    video.onloadedmetadata = () => {
      resolve({ video, objectUrl });
    };
    video.onerror = onError;
  });
}

/**
 * Some MediaRecorder webm blobs report duration as Infinity until seeked.
 * This forces the browser to compute the real duration.
 */
export function getBlobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = objectUrl;
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    video.onloadedmetadata = () => {
      if (video.duration === Infinity || Number.isNaN(video.duration)) {
        video.currentTime = 1e101;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          const d = video.duration;
          cleanup();
          resolve(Number.isFinite(d) ? d : 0);
        };
      } else {
        const d = video.duration;
        cleanup();
        resolve(d);
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to read duration"));
    };
  });
}

/**
 * Capture a single frame from a video blob at the given time as a JPEG blob.
 */
export async function captureThumbnail(
  blob: Blob,
  atSeconds = 0.1,
  maxWidth = 640,
): Promise<Blob | null> {
  const { video, objectUrl } = await loadVideoElement(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("seek failed"));
      const dur = Number.isFinite(video.duration) ? video.duration : atSeconds;
      video.currentTime = Math.min(atSeconds, Math.max(0, dur - 0.05));
    });
    const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((video.videoWidth || maxWidth) * scale);
    canvas.height = Math.round((video.videoHeight || maxWidth * 0.5625) * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82),
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Sample evenly-spaced frames across the video as small JPEG data URLs, for a
 * QuickTime-style filmstrip in the trim UI. `count` frames are captured at the
 * midpoints of `count` equal segments so each thumbnail represents its slice.
 */
export async function extractFilmstrip(
  blob: Blob,
  count = 12,
  thumbHeight = 48,
): Promise<string[]> {
  const { video, objectUrl } = await loadVideoElement(blob);
  try {
    let duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      duration = await new Promise<number>((resolve) => {
        video.currentTime = 1e101;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          resolve(Number.isFinite(video.duration) ? video.duration : 0);
        };
      });
    }
    if (!Number.isFinite(duration) || duration <= 0) return [];

    const aspect =
      (video.videoWidth || 16) / (video.videoHeight || 9) || 16 / 9;
    const h = Math.max(2, Math.round(thumbHeight));
    const w = Math.max(2, Math.round(h * aspect));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = Math.min(
        duration - 0.05,
        Math.max(0, ((i + 0.5) / count) * duration),
      );
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("seek failed"));
        video.currentTime = t;
      });
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(canvas.toDataURL("image/jpeg", 0.7));
    }
    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function pickRecorderMimeType(): string {
  // MP4 (H.264/AAC) is preferred when the browser can record it natively
  // (Safari always; Chromium 126+): the file is directly usable everywhere —
  // YouTube, QuickTime, editors — with no transcode step. WebM (also accepted
  // by YouTube) is the fallback for browsers that can't record MP4.
  const candidates = [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return "video/webm";
}
