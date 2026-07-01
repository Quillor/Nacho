/// <reference lib="webworker" />
// A steady tick used to drive the recording composite's canvas redraw. It runs
// off the main thread so its timer is NOT throttled when the recording tab is
// backgrounded or occluded — unlike requestAnimationFrame or a main-thread
// setInterval, both of which stall in hidden tabs. Without this, switching away
// from the recording tab (e.g. to the app being demoed) freezes the captured
// video on a static frame while audio keeps recording.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

type TickMessage = { type: "start"; ms: number } | { type: "stop" };

let timer: ReturnType<typeof setInterval> | undefined;

ctx.onmessage = (e: MessageEvent<TickMessage>) => {
  const data = e.data;
  if (data.type === "start") {
    if (timer !== undefined) clearInterval(timer);
    timer = setInterval(() => ctx.postMessage(0), data.ms);
  } else {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  }
};
