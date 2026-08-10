import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { loadVideoElement } from "@/lib/media";

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.onerror = () => reject(new Error("seek failed"));
    video.currentTime = time;
  });
}

export interface GifOptions {
  start: number;
  end: number;
  fps?: number;
  maxWidth?: number;
  maxFrames?: number;
}

/**
 * Sample frames across [start, end] and encode an animated GIF preview.
 */
export async function createGifFromBlob(
  blob: Blob,
  options: GifOptions,
): Promise<Blob> {
  const { start, end, fps = 6, maxWidth = 480, maxFrames = 40 } = options;
  const { video, objectUrl } = await loadVideoElement(blob);
  try {
    const duration = Math.max(0.1, end - start);
    const frameCount = Math.min(maxFrames, Math.max(2, Math.round(duration * fps)));
    const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
    const w = Math.max(2, Math.round((video.videoWidth || maxWidth) * scale));
    const h = Math.max(
      2,
      Math.round((video.videoHeight || maxWidth * 0.5625) * scale),
    );
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const encoder = GIFEncoder();
    const delay = Math.round(1000 / fps);

    // Spread samples across the FULL [start, end] range (inclusive of a frame
    // near the end) so the GIF summarizes the whole video, backing off slightly
    // from the final instant where seeking can land on an empty frame.
    const lastT = Math.max(start, end - 0.15);
    for (let i = 0; i < frameCount; i++) {
      const t =
        frameCount === 1
          ? start
          : start + (i / (frameCount - 1)) * (lastT - start);
      await seek(video, t);
      ctx.drawImage(video, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      encoder.writeFrame(index, w, h, { palette, delay });
    }

    encoder.finish();
    const bytes = encoder.bytes();
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    return new Blob([buffer], { type: "image/gif" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
