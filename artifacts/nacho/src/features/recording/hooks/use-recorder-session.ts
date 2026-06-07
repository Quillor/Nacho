import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  prepareRecording,
  type PreparedRecorder,
  type RecorderController,
  type SelfieCorner,
} from "../recorder";
import {
  startTranscription,
  isTranscriptionSupported,
  type Transcriber,
} from "../transcribe";
import { DEFAULT_CAPTION_LANG } from "../languages";
import { captureThumbnail, getBlobDuration } from "@/lib/media";
import { saveRecording } from "@/lib/db";
import { startBackgroundUpload } from "@/features/publishing";
import { type RecorderCommand } from "@/lib/desktop";
import { cloudEnabled } from "@/lib/desktop-api";
import { useDesktopPresenter } from "./use-desktop-presenter";
import { useCursorControls } from "./use-cursor-controls";
import type {
  RecordingSource,
  TranscriptSegment,
  LocalRecording,
} from "@/lib/types";

/**
 * Studio phases. `setup` lets the user configure sources; `ready` shows the live
 * composite preview (capture-affecting options are now locked); `countdown` is
 * the 3-2-1 lead-in; `recording` is the active MediaRecorder session.
 */
export type StudioPhase = "setup" | "ready" | "countdown" | "recording";

/**
 * Owns the full studio recording state machine: stream preparation, the live
 * preview, countdown, the MediaRecorder lifecycle, transcription run in lockstep
 * with the recorder, and persistence on stop. The Studio page is a thin view
 * over the values returned here.
 *
 * Why a hook: the recorder is two-phase (acquire streams + build the preview on a
 * user gesture, *then* start recording), so capture handles live in refs that
 * must survive re-renders and be torn down on unmount — logic that does not
 * belong inline in the page markup.
 */
export function useRecorderSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const cursor = useCursorControls();

  const [phase, setPhase] = useState<StudioPhase>("setup");
  const [source, setSource] = useState<RecordingSource>("screen-camera");
  const [withMic, setWithMic] = useState(true);
  const [withSystemAudio, setWithSystemAudio] = useState(true);
  const [withCaptions, setWithCaptions] = useState(isTranscriptionSupported());
  const [captionLang, setCaptionLang] = useState(DEFAULT_CAPTION_LANG);
  const [corner, setCorner] = useState<SelfieCorner>("bottom-right");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const preparedRef = useRef<PreparedRecorder | null>(null);
  const controllerRef = useRef<RecorderController | null>(null);
  const transcriberRef = useRef<Transcriber | null>(null);
  const transcriptRef = useRef<TranscriptSegment[]>([]);
  const tickRef = useRef<number>(0);

  // Release any in-flight capture/transcription resources if the user leaves
  // mid-session, so we never leak camera/screen streams.
  useEffect(() => {
    return () => {
      controllerRef.current?.cancel();
      preparedRef.current?.dispose();
      transcriberRef.current?.stop();
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const attachPreview = (prepared: PreparedRecorder) => {
    if (videoRef.current) {
      videoRef.current.srcObject = prepared.previewStream;
      void videoRef.current.play().catch(() => undefined);
    }
  };

  const enablePreview = async () => {
    setPreparing(true);
    setPermissionError(null);
    setPermissionDenied(false);
    let prepared: PreparedRecorder;
    try {
      prepared = await prepareRecording({
        source,
        withMic,
        withSystemAudio,
        corner,
        cursorOverlay: cursor.cursorOverlay,
        cursorSize: cursor.cursorSize,
        clickSound: cursor.clickSound,
        clickRipple: cursor.clickSound,
        cursorInput: cursor.cursorInput,
      });
    } catch (err) {
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError");
      setPermissionDenied(denied);
      setPermissionError(
        denied
          ? "Permission was denied, so we couldn't start the preview."
          : "Couldn't access the screen or camera. Make sure a source is available, then try again.",
      );
      setPreparing(false);
      return;
    }
    preparedRef.current = prepared;
    attachPreview(prepared);
    // Begin streaming global cursor position + clicks into the recorder so the
    // enlarged cursor and click sound work in both preview and recording.
    void cursor.startTracking(() => preparedRef.current?.triggerClick());
    setPreparing(false);
    setPhase("ready");
  };

  const reconfigure = () => {
    preparedRef.current?.dispose();
    preparedRef.current = null;
    cursor.stopTracking();
    if (videoRef.current) videoRef.current.srcObject = null;
    setPermissionError(null);
    setPermissionDenied(false);
    setPhase("setup");
  };

  const changeCorner = (next: SelfieCorner) => {
    setCorner(next);
    // Update the live composite immediately — corner is a cosmetic option that
    // stays mutable even after the preview is built.
    preparedRef.current?.setCorner(next);
  };

  const beginRecording = () => {
    const prepared = preparedRef.current;
    if (!prepared) {
      setPhase("setup");
      return;
    }
    const controller = prepared.start();
    controllerRef.current = controller;
    controller.onEnded(() => {
      void finishRecording();
    });
    attachPreview(prepared);

    transcriptRef.current = [];
    if (withCaptions && isTranscriptionSupported()) {
      transcriberRef.current = startTranscription(
        () => controller.getElapsed(),
        (seg) => {
          transcriptRef.current = [...transcriptRef.current, seg];
        },
        captionLang,
      );
    }

    setPhase("recording");
    setElapsed(0);
    setPaused(false);
    tickRef.current = window.setInterval(() => {
      setElapsed(controller.getElapsed());
    }, 250);
  };

  const startCountdown = () => {
    if (!preparedRef.current) return;
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        beginRecording();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const togglePause = () => {
    const c = controllerRef.current;
    if (!c) return;
    if (c.isPaused()) {
      c.resume();
      // Keep transcription paused/resumed in lockstep so segment timestamps
      // stay aligned with the recorder's elapsed clock.
      transcriberRef.current?.resume();
      setPaused(false);
    } else {
      c.pause();
      transcriberRef.current?.pause();
      setPaused(true);
    }
  };

  const finishRecording = async () => {
    const c = controllerRef.current;
    if (!c) return;
    controllerRef.current = null;
    preparedRef.current = null;
    if (tickRef.current) window.clearInterval(tickRef.current);
    transcriberRef.current?.stop();
    cursor.stopTracking();
    setSaving(true);

    try {
      const blob = await c.stop();
      let duration = c.getElapsed();
      if (!(duration > 0)) {
        try {
          duration = await getBlobDuration(blob);
        } catch {
          duration = 0;
        }
      }
      let thumbnail: Blob | null = null;
      try {
        thumbnail = await captureThumbnail(blob, Math.min(0.2, duration / 2));
      } catch {
        thumbnail = null;
      }

      const id = nanoid(12);
      const recording: LocalRecording = {
        id,
        title: `Recording ${new Date().toLocaleString()}`,
        description: "",
        durationSec: duration,
        trimStart: 0,
        trimEnd: duration,
        hasAudio: c.hasAudio,
        source,
        selfieCorner: source === "screen-camera" ? corner : null,
        captionLang: withCaptions ? captionLang : null,
        chapters: [],
        displayChaptersOnVideo: false,
        notifyOnView: false,
        pinned: false,
        transcript: transcriptRef.current,
        createdAt: Date.now(),
        blob,
        thumbnail,
        mimeType: c.mimeType,
        visibility: "private",
        shareId: null,
        videoPath: null,
        thumbnailPath: null,
        gifPath: null,
      };
      await saveRecording(recording);
      // Start uploading the video to storage in the background as a private
      // recording so sharing is instant later. Skipped only when cloud is
      // unavailable (desktop without a configured backend).
      if (cloudEnabled) startBackgroundUpload(recording);
      navigate(`/editor/${id}`);
    } catch {
      setSaving(false);
      setPhase("setup");
      toast({
        title: "Couldn't save recording",
        description:
          "Something went wrong while saving. Your storage may be full.",
        variant: "destructive",
      });
    }
  };

  const cancelRecording = () => {
    controllerRef.current?.cancel();
    controllerRef.current = null;
    preparedRef.current = null;
    transcriberRef.current?.stop();
    cursor.stopTracking();
    if (tickRef.current) window.clearInterval(tickRef.current);
    setPhase("setup");
  };

  // Apply a transport command from the desktop controls overlay. Reads the live
  // controller (not React state) so pause/resume can't double-toggle.
  const runCommand = (cmd: RecorderCommand) => {
    const c = controllerRef.current;
    if (cmd === "pause") {
      if (c && !c.isPaused()) togglePause();
    } else if (cmd === "resume") {
      if (c && c.isPaused()) togglePause();
    } else if (cmd === "stop") {
      void finishRecording();
    } else if (cmd === "cancel") {
      cancelRecording();
    }
  };

  // Drive the Electron presenter overlays (no-op on the web).
  useDesktopPresenter({
    phase,
    getElapsed: () => controllerRef.current?.getElapsed() ?? 0,
    isPaused: () => controllerRef.current?.isPaused() ?? false,
    runCommand,
    // Presenter camera overlay only when the camera isn't already composited
    // into the recording (screen-only); otherwise it would double-open the cam.
    overlays:
      source === "screen"
        ? ["controls", "notes", "camera"]
        : ["controls", "notes"],
  });

  const showPreview = phase !== "setup";
  const captionsAvailable = isTranscriptionSupported();
  // Capture-affecting options lock once the preview/recording is live.
  const locked = phase !== "setup";

  return {
    videoRef,
    phase,
    source,
    setSource,
    withMic,
    setWithMic,
    withSystemAudio,
    setWithSystemAudio,
    withCaptions,
    setWithCaptions,
    captionLang,
    setCaptionLang,
    corner,
    countdown,
    elapsed,
    paused,
    preparing,
    permissionError,
    permissionDenied,
    saving,
    showPreview,
    captionsAvailable,
    locked,
    cursor,
    enablePreview,
    reconfigure,
    changeCorner,
    startCountdown,
    togglePause,
    finishRecording,
    cancelRecording,
  };
}
