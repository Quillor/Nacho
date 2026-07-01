/**
 * Drive a canvas-composite redraw at ~`fps` in a way that survives the
 * recording tab being backgrounded/occluded. `requestAnimationFrame` (and a
 * main-thread `setInterval`) are throttled or paused in hidden tabs, which
 * stops the canvas from updating — so `canvas.captureStream` emits no new
 * frames and the recorded video freezes while audio keeps going. A Web Worker
 * timer is not throttled, so ticks keep flowing; the actual draw still runs on
 * the main thread (message events aren't throttled either). Falls back to
 * `requestAnimationFrame` if a worker can't be created (no worse than before).
 * Returns a stop function.
 */
export function startCompositeTicker(
  onFrame: () => void,
  fps: number,
): () => void {
  const intervalMs = Math.max(1, Math.round(1000 / fps));
  // Draw one frame immediately so the capture stream starts with content.
  onFrame();
  try {
    const worker = new Worker(new URL("./tick-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = () => onFrame();
    worker.postMessage({ type: "start", ms: intervalMs });
    return () => {
      try {
        worker.postMessage({ type: "stop" });
      } catch {
        /* ignore */
      }
      worker.terminate();
    };
  } catch {
    let rafId = 0;
    const loop = () => {
      onFrame();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }
}
