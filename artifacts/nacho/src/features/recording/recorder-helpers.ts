// Small media helpers used by the recorder's prepare/composite pipeline.

/**
 * Mix the audio tracks of the given streams into a single output track via an
 * AudioContext. `force` creates the destination even with no inputs (used so
 * the click sound has a track to land on).
 */
export function mixAudio(
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

/** Read a CSS custom property off :root, with a fallback for non-DOM envs. */
export function cssToken(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

/** Attach a stream to an off-DOM, muted, autoplaying <video> for compositing. */
export function attachVideo(stream: MediaStream): HTMLVideoElement {
  const v = document.createElement("video");
  v.srcObject = stream;
  v.muted = true;
  v.playsInline = true;
  void v.play().catch(() => undefined);
  return v;
}
