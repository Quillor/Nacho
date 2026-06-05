import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";
import {
  Monitor,
  Video as VideoIcon,
  MonitorSmartphone,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CircleDot,
  Square,
  Pause,
  Play,
  X,
  Captions,
  Languages,
  Eye,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@workspace/pico-ui/button";
import { Switch } from "@workspace/pico-ui/switch";
import { Label } from "@workspace/pico-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/pico-ui/select";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  prepareRecording,
  type PreparedRecorder,
  type RecorderController,
  type SelfieCorner,
} from "@/lib/recorder";
import {
  startTranscription,
  isTranscriptionSupported,
  type Transcriber,
} from "@/lib/transcribe";
import {
  CAPTION_LANGUAGES,
  DEFAULT_CAPTION_LANG,
} from "@/lib/languages";
import { captureThumbnail, getBlobDuration } from "@/lib/media";
import { saveRecording } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import type {
  RecordingSource,
  TranscriptSegment,
  LocalRecording,
} from "@/lib/types";

type Phase = "setup" | "ready" | "countdown" | "recording";

const SOURCES: { id: RecordingSource; label: string; icon: typeof Monitor }[] = [
  { id: "screen", label: "Screen", icon: Monitor },
  { id: "screen-camera", label: "Screen + Cam", icon: MonitorSmartphone },
  { id: "camera", label: "Camera", icon: VideoIcon },
];

export default function Studio() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("setup");
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
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const preparedRef = useRef<PreparedRecorder | null>(null);
  const controllerRef = useRef<RecorderController | null>(null);
  const transcriberRef = useRef<Transcriber | null>(null);
  const transcriptRef = useRef<TranscriptSegment[]>([]);
  const tickRef = useRef<number>(0);

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
    let prepared: PreparedRecorder;
    try {
      prepared = await prepareRecording({
        source,
        withMic,
        withSystemAudio,
        corner,
      });
    } catch (err) {
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError");
      setPermissionError(
        denied
          ? "Permission was denied. Allow screen and camera access in your browser, then try again."
          : "Couldn't access the screen or camera. Make sure a source is available and try again.",
      );
      setPreparing(false);
      return;
    }
    preparedRef.current = prepared;
    attachPreview(prepared);
    setPreparing(false);
    setPhase("ready");
  };

  const reconfigure = () => {
    preparedRef.current?.dispose();
    preparedRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPhase("setup");
  };

  const changeCorner = (next: SelfieCorner) => {
    setCorner(next);
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
        captionLang: withCaptions ? captionLang : null,
        chapters: [],
        displayChaptersOnVideo: false,
        notifyOnView: false,
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
    if (tickRef.current) window.clearInterval(tickRef.current);
    setPhase("setup");
  };

  const showPreview = phase !== "setup";
  const captionsAvailable = isTranscriptionSupported();
  const locked = phase !== "setup";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
 <h1 className="mb-2 font-display text-5xl font-extrabold tracking-tight">
          Studio
        </h1>
        <p className="mb-8 text-lg font-medium text-muted-foreground">
          Set the scene, then hit record.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ---- Left column: controls ---- */}
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block font-display text-sm font-bold uppercase tracking-wide">
                What to capture
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {SOURCES.map((s) => {
                  const Icon = s.icon;
                  const active = source === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={locked}
                      onClick={() => setSource(s.id)}
                      className={cn(
"flex flex-col items-center gap-2 border-4 px-3 py-5 font-bold transition-all",
                        active
                          ? "border-foreground bg-primary text-primary-foreground shadow-sm"
                          : "border-foreground bg-card hover:bg-muted",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <Icon className="h-7 w-7" />
                      <span className="text-xs">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 border-4 border-foreground bg-card p-5">
              <ToggleRow
                icon={withMic ? Mic : MicOff}
                label="Microphone"
                checked={withMic}
                onChange={setWithMic}
                disabled={locked}
              />
              {source !== "camera" && (
                <ToggleRow
                  icon={withSystemAudio ? Volume2 : VolumeX}
                  label="System audio"
                  checked={withSystemAudio}
                  onChange={setWithSystemAudio}
                  disabled={locked}
                />
              )}
              <ToggleRow
                icon={Captions}
                label="Live captions"
                checked={withCaptions}
                onChange={setWithCaptions}
                disabled={!captionsAvailable}
                hint={
                  captionsAvailable
                    ? undefined
                    : "Not supported in this browser"
                }
              />
              {withCaptions && captionsAvailable && (
                <div className="flex items-center justify-between gap-4 border-t-2 border-dashed border-foreground/20 pt-3">
                  <div className="flex items-center gap-3">
                    <Languages className="h-5 w-5" />
                    <span className="font-bold">Caption language</span>
                  </div>
                  <Select value={captionLang} onValueChange={setCaptionLang}>
                    <SelectTrigger className="w-44 border-2 border-foreground font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPTION_LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {source === "screen-camera" && (
              <div className="space-y-3 border-4 border-foreground bg-card p-5">
                <Label className="block font-display text-sm font-bold uppercase tracking-wide">
                  Selfie corner
                </Label>
                <CornerPicker value={corner} onChange={changeCorner} />
                <p className="text-xs font-medium text-muted-foreground">
                  Pick where the camera bubble sits in the recording.
                </p>
              </div>
            )}

            {permissionError && (
              <div className="flex items-start gap-3 border-4 border-destructive bg-destructive/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm font-bold text-destructive">
                  {permissionError}
                </p>
              </div>
            )}

            {phase === "setup" && (
              <Button
                size="lg"
                onClick={() => void enablePreview()}
                disabled={preparing}
                className="h-16 w-full border-4 border-foreground bg-primary text-xl font-black uppercase tracking-wide text-primary-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm disabled:opacity-70"
              >
                <Eye className="mr-2 h-6 w-6" />
                {preparing ? "Requesting access…" : "Enable Preview"}
              </Button>
            )}

            {phase === "ready" && (
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={startCountdown}
                  className="h-16 w-full border-4 border-foreground bg-primary text-xl font-black uppercase tracking-wide text-primary-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
                >
                  <CircleDot className="mr-2 h-6 w-6" />
                  Start Recording
                </Button>
                <Button
                  variant="outline"
                  onClick={reconfigure}
 className="h-12 w-full border-4 border-foreground font-bold"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Reconfigure
                </Button>
              </div>
            )}

            {phase === "recording" && (
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={togglePause}
 className="h-14 border-4 border-foreground px-6 font-bold"
                >
                  {paused ? (
                    <>
                      <Play className="mr-2 h-5 w-5" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-5 w-5" /> Pause
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  onClick={() => void finishRecording()}
                  disabled={saving}
 className="h-14 border-4 border-foreground bg-primary px-8 font-black text-primary-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm disabled:opacity-70"
                >
                  <Square className="mr-2 h-5 w-5" />
                  {saving ? "Saving…" : "Stop & Save"}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={cancelRecording}
                  disabled={saving}
 className="h-14 px-4 font-bold text-muted-foreground"
                >
                  <X className="mr-2 h-5 w-5" /> Discard
                </Button>
              </div>
            )}
          </div>

          {/* ---- Right column: live preview ---- */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative overflow-hidden border-4 border-foreground bg-foreground shadow-md">
              <video
                ref={videoRef}
                muted
                playsInline
                className={cn(
                  "aspect-video w-full bg-foreground object-contain",
                  showPreview ? "block" : "hidden",
                )}
              />

              {!showPreview && (
                <div className="flex aspect-video w-full items-center justify-center bg-foreground">
                  <div className="text-center text-background/70">
                    <CircleDot className="mx-auto mb-4 h-16 w-16" />
 <p className="font-display text-2xl font-bold">
                      Live preview appears here
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      Enable preview to grant access and see your feed.
                    </p>
                  </div>
                </div>
              )}

              {phase === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
                  <span className="font-display text-[8rem] font-extrabold text-background">
                    {countdown}
                  </span>
                </div>
              )}

              {phase === "recording" && (
                <div className="absolute left-4 top-4 flex items-center gap-2 border-2 border-foreground bg-background px-3 py-1.5">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full bg-destructive",
                      !paused && "animate-pulse",
                    )}
                  />
                  <span className="font-mono text-sm font-bold">
                    {formatDuration(elapsed)}
                  </span>
                  {paused && (
 <span className="font-bold text-muted-foreground">
                      Paused
                    </span>
                  )}
                </div>
              )}
            </div>

            {phase === "ready" && (
              <p className="mt-3 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Preview live — press start when you're ready.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const CORNERS: { id: SelfieCorner; pos: string }[] = [
  { id: "top-left", pos: "left-2 top-2" },
  { id: "top-right", pos: "right-2 top-2" },
  { id: "bottom-left", pos: "left-2 bottom-2" },
  { id: "bottom-right", pos: "right-2 bottom-2" },
];

function CornerPicker({
  value,
  onChange,
}: {
  value: SelfieCorner;
  onChange: (c: SelfieCorner) => void;
}) {
  return (
    <div className="relative aspect-video w-full border-4 border-foreground bg-muted">
      {CORNERS.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-label={c.id}
          aria-pressed={value === c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "absolute h-8 w-8 rounded-full border-2 border-foreground transition-all",
            c.pos,
            value === c.id
              ? "scale-110 bg-primary"
              : "bg-card hover:bg-background",
          )}
        />
      ))}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  icon: typeof Mic;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div>
          <span className="font-bold">{label}</span>
          {hint && (
            <p className="text-xs font-medium text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
