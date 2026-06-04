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
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { startRecording, type RecorderController } from "@/lib/recorder";
import {
  startTranscription,
  isTranscriptionSupported,
  type Transcriber,
} from "@/lib/transcribe";
import { captureThumbnail, getBlobDuration } from "@/lib/media";
import { saveRecording } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import type {
  RecordingSource,
  TranscriptSegment,
  LocalRecording,
} from "@/lib/types";

type Phase = "setup" | "countdown" | "recording";

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
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controllerRef = useRef<RecorderController | null>(null);
  const transcriberRef = useRef<Transcriber | null>(null);
  const transcriptRef = useRef<TranscriptSegment[]>([]);
  const tickRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      controllerRef.current?.cancel();
      transcriberRef.current?.stop();
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const beginRecording = async () => {
    let controller: RecorderController;
    try {
      controller = await startRecording({ source, withMic, withSystemAudio });
    } catch {
      toast({
        title: "Couldn't start recording",
        description: "Permission was denied or no source was selected.",
        variant: "destructive",
      });
      setPhase("setup");
      return;
    }

    controllerRef.current = controller;
    controller.onEnded(() => {
      void finishRecording();
    });

    if (videoRef.current) {
      videoRef.current.srcObject = controller.previewStream;
      void videoRef.current.play().catch(() => undefined);
    }

    transcriptRef.current = [];
    if (withCaptions && isTranscriptionSupported()) {
      transcriberRef.current = startTranscription(
        () => controller.getElapsed(),
        (seg) => {
          transcriptRef.current = [...transcriptRef.current, seg];
        },
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
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        void beginRecording();
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
    if (tickRef.current) window.clearInterval(tickRef.current);
    transcriberRef.current?.stop();

    const blob = await c.stop();
    const duration =
      c.getElapsed() > 0 ? c.getElapsed() : await getBlobDuration(blob);
    const thumbnail = await captureThumbnail(blob, Math.min(0.2, duration / 2));

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
      chapters: [],
      transcript: transcriptRef.current,
      createdAt: Date.now(),
      blob,
      thumbnail,
      mimeType: c.mimeType,
      shareId: null,
      videoPath: null,
      thumbnailPath: null,
      gifPath: null,
    };
    await saveRecording(recording);
    navigate(`/editor/${id}`);
  };

  const cancelRecording = () => {
    controllerRef.current?.cancel();
    controllerRef.current = null;
    transcriberRef.current?.stop();
    if (tickRef.current) window.clearInterval(tickRef.current);
    setPhase("setup");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 font-display text-5xl font-black uppercase tracking-tight">
          Studio
        </h1>
        <p className="mb-8 text-lg font-medium text-muted-foreground">
          Set the scene, then hit record.
        </p>

        <div className="relative overflow-hidden border-4 border-foreground bg-foreground shadow-md">
          <video
            ref={videoRef}
            muted
            playsInline
            className={cn(
              "aspect-video w-full bg-foreground object-contain",
              phase === "recording" ? "block" : "hidden",
            )}
          />

          {phase !== "recording" && (
            <div className="flex aspect-video w-full items-center justify-center bg-foreground">
              {phase === "countdown" ? (
                <span className="font-display text-[8rem] font-black text-background">
                  {countdown}
                </span>
              ) : (
                <div className="text-center text-background/70">
                  <CircleDot className="mx-auto mb-4 h-16 w-16" />
                  <p className="font-display text-2xl font-bold uppercase">
                    Live preview appears here
                  </p>
                </div>
              )}
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
                <span className="font-bold uppercase text-muted-foreground">
                  Paused
                </span>
              )}
            </div>
          )}
        </div>

        {phase === "setup" && (
          <div className="mt-8 space-y-6">
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
                      onClick={() => setSource(s.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 border-4 px-3 py-5 font-bold uppercase transition-all",
                        active
                          ? "border-foreground bg-primary text-primary-foreground shadow-sm"
                          : "border-foreground bg-card hover:bg-muted",
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
              />
              {source !== "camera" && (
                <ToggleRow
                  icon={withSystemAudio ? Volume2 : VolumeX}
                  label="System audio"
                  checked={withSystemAudio}
                  onChange={setWithSystemAudio}
                />
              )}
              <ToggleRow
                icon={Captions}
                label="Live captions"
                checked={withCaptions}
                onChange={setWithCaptions}
                disabled={!isTranscriptionSupported()}
                hint={
                  isTranscriptionSupported()
                    ? undefined
                    : "Not supported in this browser"
                }
              />
            </div>

            <Button
              size="lg"
              onClick={startCountdown}
              className="h-16 w-full border-4 border-foreground bg-primary text-xl font-black uppercase tracking-wide text-primary-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
            >
              <CircleDot className="mr-2 h-6 w-6" />
              Start Recording
            </Button>
          </div>
        )}

        {phase === "recording" && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={togglePause}
              className="h-14 border-4 border-foreground px-6 font-bold uppercase"
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
              className="h-14 border-4 border-foreground bg-destructive px-8 font-black uppercase text-destructive-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
            >
              <Square className="mr-2 h-5 w-5" /> Stop & Save
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={cancelRecording}
              className="h-14 px-4 font-bold uppercase text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
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
