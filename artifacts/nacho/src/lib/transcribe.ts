import type { TranscriptSegment } from "./types";

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
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let running = true;
  let paused = false;
  let segStart = getElapsed();

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        const end = getElapsed();
        if (text) onSegment({ start: segStart, end, text });
        segStart = end;
      }
    }
  };

  recognition.onend = () => {
    if (running && !paused) {
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    }
  };

  recognition.onerror = () => {
    /* keep going; onend will restart if still running */
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
      segStart = getElapsed();
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
