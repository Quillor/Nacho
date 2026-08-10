import type { TranscriptSegment } from "@/lib/types";

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export interface Transcriber {
  pause(): void;
  resume(): void;
  stop(): void;
  isSupported: boolean;
}

export function isTranscriptionSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startTranscription(
  getElapsed: () => number,
  onSegment: (seg: TranscriptSegment) => void,
  lang = "en-US",
  /**
   * Called once when recognition is denied or unreachable (mic permission,
   * no speech service) so the UI can tell the user captions won't happen —
   * instead of silently recording an empty transcript.
   */
  onUnavailable?: (reason: string) => void,
): Transcriber {
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | SpeechRecognitionCtor
    | undefined;
  if (!Ctor) {
    return {
      pause: () => undefined,
      resume: () => undefined,
      stop: () => undefined,
      isSupported: false,
    };
  }

  const recognition = new Ctor();
  recognition.continuous = true;
  // Interim results are used purely for TIMING: the first interim of an
  // utterance stamps when speech actually began, so the final segment carries
  // real start/end times instead of "whenever the engine finalized" — which
  // used to lag several seconds and made caption sync feel broken.
  recognition.interimResults = true;
  recognition.lang = lang;

  let running = true;
  let paused = false;
  let lastEnd = getElapsed();
  let utteranceStart: number | null = null;
  let notifiedUnavailable = false;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal) {
        // First interim of a new utterance — speech is happening right now.
        if (utteranceStart === null) utteranceStart = getElapsed();
        continue;
      }
      const text = result[0].transcript.trim();
      const end = getElapsed();
      const start = Math.min(utteranceStart ?? lastEnd, end);
      if (text) onSegment({ start, end, text });
      lastEnd = end;
      utteranceStart = null;
    }
  };

  recognition.onend = () => {
    utteranceStart = null;
    if (running && !paused) {
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    }
  };

  recognition.onerror = (event) => {
    // Terminal failures (mic denied, speech service unreachable) would
    // otherwise loop silently via the onend auto-restart. Stop and tell the
    // caller once so the UI can surface it.
    const err = (event as { error?: string })?.error ?? "";
    if (
      err === "not-allowed" ||
      err === "service-not-allowed" ||
      err === "language-not-supported"
    ) {
      running = false;
      if (!notifiedUnavailable) {
        notifiedUnavailable = true;
        onUnavailable?.(err);
      }
    }
    /* transient errors (no-speech, network blips): onend restarts */
  };

  try {
    recognition.start();
  } catch {
    /* ignore */
  }

  return {
    isSupported: true,
    pause() {
      if (paused) return;
      paused = true;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    resume() {
      if (!paused || !running) return;
      paused = false;
      lastEnd = getElapsed();
      try {
        recognition.start();
      } catch {
        /* ignore */
      }
    },
    stop() {
      running = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}
