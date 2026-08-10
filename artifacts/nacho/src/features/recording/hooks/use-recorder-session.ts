import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  prepareRecording,
  type PreparedRecorder,
  type RecorderController,
  type SelfieCorner,
  type CameraSize,
} from "../recorder";
import {
  startTranscription,
  isTranscriptionSupported,
  type Transcriber,
} from "../transcribe";
import { DEFAULT_CAPTION_LANG } from "../languages";
import { persistFinishedRecording } from "../finish-recording";
import { type RecorderCommand } from "@/lib/desktop";
import { useSourcePicker } from "./use-source-picker";
import { useDesktopPresenter } from "./use-desktop-presenter";
import { useCursorControls } from "./use-cursor-controls";
import type { RecordingSource, TranscriptSegment } from "@/lib/types";

/**
 * Studio phases. `setup` lets the user configure sources; `ready` shows the live
 * composite preview (capture-affecting options are now locked); `countdown` is
 * the 3-2-1 lead-in; `recording` is the active MediaRecorder session.
 */
export type StudioPhase = "setup" | "ready" | "countdown" | "recording";

/**
 * Hard cap on a single recording. Nacho records at a fixed 5 Mbps into one
 * in-memory blob, so very long sessions risk crashing low-end devices/Safari and
 * losing the whole take. At the cap we auto-stop down the normal stop/save path.
 * Tracked against the recorder's `elapsed` clock, which already excludes paused
 * time, so pausing never counts against the limit.
 */
export const MAX_RECORDING_SECONDS = 30 * 60;

/** How close to the cap (seconds remaining) before we surface the warning. */
export const RECORDING_WARN_SECONDS = 2 * 60;

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
  const [cameraSize, setCameraSize] = useState<CameraSize>("small");
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

  const startPreview = async () => {
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
        cameraSize,
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

  // "Enable preview" goes through the desktop's in-app share picker when
  // available; startPreview runs once a source is locked in (or directly on
  // the web, where the browser picker is mandatory).
  const { sourcePickerOpen, enablePreview, confirmSource, cancelSourcePicker } =
    useSourcePicker(source, startPreview);

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

  const changeCameraSize = (next: CameraSize) => {
    setCameraSize(next);
    // Same live-mutable mechanism as the corner: the composite's draw loop
    // picks the new size up on its next tick, mid-recording included.
    preparedRef.current?.setCameraSize(next);
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
        () => {
          toast({
            title: "Live captions unavailable",
            description:
              "Speech recognition couldn't start (microphone permission or speech service). Recording continues without captions.",
            variant: "destructive",
          });
        },
      );
    }

    setPhase("recording");
    setElapsed(0);
    setPaused(false);
    tickRef.current = window.setInterval(() => {
      const e = controller.getElapsed();
      setElapsed(e);
      // Hard 30-minute cap: auto-stop down the exact same save path as a manual
      // Stop (transcription pause, local save, editor navigation, presenter
      // teardown) so the user never hits the memory wall unexpectedly.
      if (e >= MAX_RECORDING_SECONDS) void finishRecording();
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
      const id = await persistFinishedRecording({
        controller: c,
        source,
        corner,
        captionLang: withCaptions ? captionLang : null,
        transcript: transcriptRef.current,
      });
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
    } else if (cmd.startsWith("camera:")) {
      changeCameraSize(cmd.slice("camera:".length) as CameraSize);
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
    cameraSize,
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
    sourcePickerOpen,
    confirmSource,
    cancelSourcePicker,
    reconfigure,
    changeCorner,
    changeCameraSize,
    startCountdown,
    togglePause,
    finishRecording,
    cancelRecording,
  };
}
