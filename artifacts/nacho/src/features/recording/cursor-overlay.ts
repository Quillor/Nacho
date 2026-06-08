// Renderer-side helpers for the desktop cursor-controls feature: mapping the
// global cursor position onto the recorded canvas, drawing an enlarged synthetic
// cursor + click ripples, and synthesizing a click sound mixed into the
// recording's audio.
//
// Host-agnostic — no Electron imports. The desktop layer supplies the live
// cursor position / display bounds via `RecorderOptions.cursorInput`, and the
// click events by calling the controller's `triggerClick()`.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Point {
  x: number;
  y: number;
}

export interface CursorInput {
  /** Latest global cursor position in screen DIP coordinates, or null. */
  getPoint(): Point | null;
  /** Bounds (DIP) of the display being captured, or null if unknown. */
  getDisplayBounds(): Rect | null;
}

/**
 * Map a global screen point to canvas pixel coordinates. DPI-agnostic: divides
 * the DIP offset by the DIP bounds and multiplies by the physical canvas size,
 * so mixed-DPI setups work as long as bounds and canvas come from the same
 * display. Returns null when the cursor is outside the captured display, so the
 * caller can hide the synthetic cursor.
 */
export function mapToCanvas(
  point: Point,
  bounds: Rect | null,
  canvasW: number,
  canvasH: number,
): Point | null {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
  const fx = (point.x - bounds.x) / bounds.width;
  const fy = (point.y - bounds.y) / bounds.height;
  if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return null;
  return { x: fx * canvasW, y: fy * canvasH };
}

// Classic arrow-pointer outline, hotspot at (0,0), in ~24px base units.
const ARROW: Point[] = [
  { x: 0, y: 0 },
  { x: 0, y: 17 },
  { x: 4.2, y: 13 },
  { x: 7, y: 19.5 },
  { x: 9.8, y: 18.3 },
  { x: 7, y: 11.8 },
  { x: 12, y: 11.8 },
];

/** Draw the enlarged synthetic cursor with its tip (hotspot) at (cx, cy). */
export function drawCursor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(ARROW[0].x, ARROW[0].y);
  for (let i = 1; i < ARROW.length; i++) ctx.lineTo(ARROW[i].x, ARROW[i].y);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export interface Ripple {
  x: number;
  y: number;
  start: number;
}
const RIPPLE_MS = 450;

/** Draw and expire click ripples; returns the still-living ones. */
export function drawRipples(
  ctx: CanvasRenderingContext2D,
  ripples: Ripple[],
  now: number,
  pxScale: number,
): Ripple[] {
  const alive: Ripple[] = [];
  for (const r of ripples) {
    const t = (now - r.start) / RIPPLE_MS;
    if (t >= 1) continue;
    alive.push(r);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.arc(r.x, r.y, (8 + 26 * t) * pxScale, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd200";
    ctx.lineWidth = 3 * pxScale;
    ctx.stroke();
    ctx.restore();
  }
  return alive;
}

let clickBufferCache: AudioBuffer | null = null;

/**
 * Load and decode the click sound (public/click.mp3) for the recording's audio
 * mix. Cached after first load. Returns null if it can't be loaded.
 */
export async function loadClickBuffer(
  ctx: AudioContext,
): Promise<AudioBuffer | null> {
  if (clickBufferCache) return clickBufferCache;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}click.mp3`);
    const data = await res.arrayBuffer();
    clickBufferCache = await ctx.decodeAudioData(data);
    return clickBufferCache;
  } catch {
    return null;
  }
}

/**
 * Play one click into the same MediaStreamDestination the recorder records, so
 * it lands in the output audio. Not connected to ctx.destination — it is never
 * played out the speakers (no echo / double-capture).
 */
export function playClick(
  ctx: AudioContext,
  dest: MediaStreamAudioDestinationNode,
  buffer: AudioBuffer,
): void {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(dest);
  src.start();
}
