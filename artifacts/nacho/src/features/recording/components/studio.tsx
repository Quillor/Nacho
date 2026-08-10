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
  MousePointer2,
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
import {
  useRecorderSession,
  MAX_RECORDING_SECONDS,
  RECORDING_WARN_SECONDS,
} from "../hooks/use-recorder-session";
import { ToggleRow } from "./toggle-row";
import { RecordingTimer } from "./recording-timer";
import { SelfieCornerOverlay } from "./selfie-corner-overlay";
import { CameraSizeControl } from "./camera-size-control";
import { SourcePicker } from "./source-picker";
import { isDesktop } from "@/lib/desktop";
import { SpeakerNotesPanel } from "@/features/notes";

const SOURCES: { id: RecordingSource; label: string; icon: typeof Monitor }[] = [
  { id: "screen", label: "Screen", icon: Monitor },
  { id: "screen-camera", label: "Screen + Cam", icon: MonitorSmartphone },
  { id: "camera", label: "Camera", icon: VideoIcon },
];

export function Studio() {
  const s = useRecorderSession();
  const showSelfiePicker =
    s.source === "screen-camera" && (s.phase === "setup" || s.phase === "ready");
  // Camera size stays adjustable through the whole session, recording included.
  const showCameraSize =
    s.source === "screen-camera" &&
    (s.phase === "ready" || s.phase === "countdown" || s.phase === "recording");
  const remaining = Math.max(0, MAX_RECORDING_SECONDS - s.elapsed);
  const nearingLimit =
    s.phase === "recording" && remaining <= RECORDING_WARN_SECONDS;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <SourcePicker
          open={s.sourcePickerOpen}
          onCancel={s.cancelSourcePicker}
          onConfirm={(id) => void s.confirmSource(id)}
        />
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


            {s.cursor.available && (
              <>
                <div className="border-t-2 border-dashed border-foreground/20 pt-2" />
                <ToggleRow
                  icon={MousePointer2}
                  label="Enlarge cursor"
                  checked={s.cursor.cursorOverlay}
                  onChange={s.cursor.setCursorOverlay}
                  disabled={s.locked || s.source === "camera"}
                  hint={
                    s.source === "camera" ? "Screen capture only" : undefined
                  }
                />
                {s.cursor.cursorOverlay && s.source !== "camera" && (
                  <div className="flex items-center justify-between gap-4 border-t border-dashed border-foreground/20 pt-3">
                    <span className="font-bold">Cursor size</span>
                    <Select
                      value={String(s.cursor.cursorSize)}
                      onValueChange={(v) => s.cursor.setCursorSize(Number(v))}
                      disabled={s.locked}
                    >
                      <SelectTrigger className="w-32 border border-foreground font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.5">1.5×</SelectItem>
                        <SelectItem value="2">2×</SelectItem>
                        <SelectItem value="2.5">2.5×</SelectItem>
                        <SelectItem value="3">3×</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <ToggleRow
                  icon={Volume2}
                  label="Click sound"
                  checked={s.cursor.clickSound}
                  onChange={s.cursor.setClickSound}
                  disabled={s.locked}
                  hint="Plays on click — needs Accessibility permission"
                />
              </>
            )}
            </div>

            {isDesktop && <SpeakerNotesPanel />}

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

            {nearingLimit && (
              <div className="flex items-start gap-3 border-2 border-foreground bg-accent p-4 text-accent-foreground">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-bold">
                  Heads up — recording auto-stops at the 30-minute limit.{" "}
                  <span className="font-mono">{formatDuration(remaining)}</span>{" "}
                  left, then we'll save everything captured so far.
                </p>
              </div>
            )}

            {showCameraSize && (
              <CameraSizeControl
                value={s.cameraSize}
                onChange={s.changeCameraSize}
              />
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
                <RecordingTimer
                  elapsed={s.elapsed}
                  paused={s.paused}
                  nearingLimit={nearingLimit}
                />
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
