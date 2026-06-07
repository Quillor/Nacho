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
import { Label } from "@workspace/pico-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/pico-ui/select";
import { cn } from "@/lib/utils";
import { CAPTION_LANGUAGES } from "../languages";
import { formatDuration } from "@workspace/shared";
import type { RecordingSource } from "@/lib/types";
import { useRecorderSession } from "../hooks/use-recorder-session";
import { ToggleRow } from "./toggle-row";
import { SelfieCornerOverlay } from "./selfie-corner-overlay";

const SOURCES: { id: RecordingSource; label: string; icon: typeof Monitor }[] = [
  { id: "screen", label: "Screen", icon: Monitor },
  { id: "screen-camera", label: "Screen + Cam", icon: MonitorSmartphone },
  { id: "camera", label: "Camera", icon: VideoIcon },
];

export function Studio() {
  const s = useRecorderSession();
  const showSelfiePicker =
    s.source === "screen-camera" && (s.phase === "setup" || s.phase === "ready");

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
                {SOURCES.map((src) => {
                  const Icon = src.icon;
                  const active = s.source === src.id;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      disabled={s.locked}
                      onClick={() => s.setSource(src.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 border-2 px-3 py-5 font-bold transition-all",
                        active
                          ? "border-foreground bg-accent text-accent-foreground shadow-sm"
                          : "border-foreground bg-card hover:bg-muted",
                        s.locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <Icon className="h-7 w-7" />
                      <span className="text-xs">{src.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 border-2 border-foreground bg-card p-5">
              <ToggleRow
                icon={s.withMic ? Mic : MicOff}
                label="Microphone"
                checked={s.withMic}
                onChange={s.setWithMic}
                disabled={s.locked}
              />
              {s.source !== "camera" && (
                <ToggleRow
                  icon={s.withSystemAudio ? Volume2 : VolumeX}
                  label="System audio"
                  checked={s.withSystemAudio}
                  onChange={s.setWithSystemAudio}
                  disabled={s.locked}
                />
              )}
              <ToggleRow
                icon={Captions}
                label="Live captions"
                checked={s.withCaptions}
                onChange={s.setWithCaptions}
                disabled={!s.captionsAvailable}
                hint={
                  s.captionsAvailable
                    ? undefined
                    : "Not supported in this browser"
                }
              />
              {s.withCaptions && s.captionsAvailable && (
                <div className="flex items-center justify-between gap-4 border-t border-dashed border-foreground/20 pt-3">
                  <div className="flex items-center gap-3">
                    <Languages className="h-5 w-5" />
                    <span className="font-bold">Caption language</span>
                  </div>
                  <Select value={s.captionLang} onValueChange={s.setCaptionLang}>
                    <SelectTrigger className="w-44 border border-foreground font-bold">
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

            {s.permissionError && (
              <div className="space-y-3 border-2 border-destructive bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-destructive">
                      {s.permissionError}
                    </p>
                    {s.permissionDenied && (
                      <p className="text-sm font-medium text-destructive/80">
                        Click the camera or lock icon in your browser's address
                        bar, set screen and camera access to “Allow”, then try
                        again.
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => void s.enablePreview()}
                  disabled={s.preparing}
                  className="h-11 w-full border-2 border-destructive bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-70"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  {s.preparing ? "Requesting access…" : "Try again"}
                </Button>
              </div>
            )}

            {s.phase === "recording" && (
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={s.togglePause}
                  className="h-14 border-2 border-foreground px-6 font-bold"
                >
                  {s.paused ? (
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
                  onClick={() => void s.finishRecording()}
                  disabled={s.saving}
                  className="h-14 border-2 border-foreground bg-accent px-8 font-black text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm disabled:opacity-70"
                >
                  <Square className="mr-2 h-5 w-5" />
                  {s.saving ? "Saving…" : "Stop & Save"}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={s.cancelRecording}
                  disabled={s.saving}
                  className="h-14 px-4 font-bold text-muted-foreground"
                >
                  <X className="mr-2 h-5 w-5" /> Discard
                </Button>
              </div>
            )}
          </div>

          {/* ---- Right column: live preview ---- */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative overflow-hidden border-2 border-foreground bg-foreground shadow-md">
              <video
                ref={s.videoRef}
                muted
                playsInline
                className={cn(
                  "aspect-video w-full bg-foreground object-contain",
                  s.showPreview ? "block" : "hidden",
                )}
              />

              {!s.showPreview && (
                <div className="flex aspect-video w-full items-center justify-center bg-foreground">
                  <div className="text-center text-background/70">
                    <p className="font-display text-2xl font-bold">
                      Live preview appears here
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      Enable preview to grant access and see your feed.
                    </p>
                  </div>
                </div>
              )}

              {s.phase === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
                  <span className="font-display text-[8rem] font-extrabold text-background">
                    {s.countdown}
                  </span>
                </div>
              )}

              {s.phase === "recording" && (
                <div className="absolute left-4 top-4 flex items-center gap-2 border border-foreground bg-background px-3 py-1.5">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full bg-destructive",
                      !s.paused && "animate-pulse",
                    )}
                  />
                  <span className="font-mono text-sm font-bold">
                    {formatDuration(s.elapsed)}
                  </span>
                  {s.paused && (
                    <span className="font-bold text-muted-foreground">
                      Paused
                    </span>
                  )}
                </div>
              )}

              {showSelfiePicker && (
                <SelfieCornerOverlay
                  corner={s.corner}
                  onChange={s.changeCorner}
                  cameraLive={s.phase === "ready"}
                />
              )}
            </div>

            {s.phase === "setup" && (
              <Button
                size="lg"
                onClick={() => void s.enablePreview()}
                disabled={s.preparing}
                className="mt-3 h-16 w-full border-2 border-foreground bg-accent text-xl font-black uppercase tracking-wide text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm disabled:opacity-70"
              >
                <Eye className="mr-2 h-6 w-6" />
                {s.preparing ? "Requesting access…" : "Enable Preview"}
              </Button>
            )}

            {s.phase === "ready" && (
              <div className="mt-3 flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={s.startCountdown}
                  className="h-16 w-full border-2 border-foreground bg-destructive text-xl font-black uppercase tracking-wide text-destructive-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
                >
                  <CircleDot className="mr-2 h-6 w-6" />
                  Start Recording
                </Button>
                <Button
                  variant="outline"
                  onClick={s.reconfigure}
                  className="h-12 w-full border-2 border-foreground font-bold"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Reconfigure
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
