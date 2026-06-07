import type { SelfieCorner } from "@/lib/types";

// Canvas compositing helpers shared by the recorder's draw loop: object-fit
// "cover" image drawing and the circular camera bubble (the selfie composited
// into the screen recording).

export function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const vw = video.videoWidth || dw;
  const vh = video.videoHeight || dh;
  const scale = Math.max(dw / vw, dh / vh);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** Draw the circular camera bubble in the chosen corner with a colored ring. */
export function drawCameraBubble(
  ctx: CanvasRenderingContext2D,
  cameraVideo: HTMLVideoElement,
  canvasW: number,
  canvasH: number,
  corner: SelfieCorner,
  ringColor: string,
): void {
  const size = Math.round(canvasH * 0.26);
  const margin = Math.round(canvasH * 0.03);
  const right = canvasW - size - margin;
  const bottom = canvasH - size - margin;
  const cx = corner === "top-left" || corner === "bottom-left" ? margin : right;
  const cy = corner === "top-left" || corner === "top-right" ? margin : bottom;
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
}
