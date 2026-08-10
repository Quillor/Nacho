import { useEffect, useState } from "react";
import { Pause, Play, Square, X, UserRound } from "lucide-react";
import { formatDuration } from "@workspace/shared";
import { cn } from "@/lib/utils";
import {
  desktopBridge,
  type RecorderCommand,
  type RecorderStatus,
} from "@/lib/desktop";
import { OverlayShell, DRAG_REGION, NO_DRAG_REGION } from "./overlay-shell";

// Presenter-only transport HUD (content-protected window). Buttons send
// commands to the main window's recorder; the timer/paused state arrives via
// recorder status. Matches the in-app recording controls' chunky brand styling.
export function ControlsOverlay() {
  const [status, setStatus] = useState<RecorderStatus>({
    elapsed: 0,
    paused: false,
    phase: "recording",
  });

  useEffect(() => {
    const bridge = desktopBridge;
    if (!bridge) return;
    return bridge.onStatus(setStatus);
  }, []);

  const send = (cmd: RecorderCommand) => desktopBridge?.sendCommand(cmd);

  // Camera-size cycle (none → small → large → full). The overlay can't read
  // the recorder's current size, so it tracks its own cursor starting from the
  // default; each click sends an absolute size command.
  const CAMERA_SIZES = ["small", "large", "full", "none"] as const;
  const [cameraIdx, setCameraIdx] = useState(0);
  const cycleCamera = () => {
    const next = (cameraIdx + 1) % CAMERA_SIZES.length;
    setCameraIdx(next);
    send(`camera:${CAMERA_SIZES[next]}` as RecorderCommand);
  };

  const btn =
    "flex h-10 w-10 items-center justify-center border-2 border-foreground bg-card transition-colors hover:bg-muted";

  return (
    <OverlayShell className="flex items-center justify-center p-2">
      <div
        style={DRAG_REGION}
        className="flex items-center gap-2 rounded-full border-4 border-foreground bg-background px-3 py-2 shadow-md"
      >
        <div className="flex items-center gap-2 px-1">
          <span
            className={cn(
              "h-3 w-3 rounded-full bg-destructive",
              !status.paused && "animate-pulse",
            )}
          />
          <span className="font-mono text-sm font-bold tabular-nums">
            {formatDuration(status.elapsed)}
          </span>
          {status.paused && (
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Paused
            </span>
          )}
        </div>

        <button
          type="button"
          style={NO_DRAG_REGION}
          aria-label={status.paused ? "Resume" : "Pause"}
          onClick={() => send(status.paused ? "resume" : "pause")}
          className={btn}
        >
          {status.paused ? (
            <Play className="h-5 w-5" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
        </button>

        <button
          type="button"
          style={NO_DRAG_REGION}
          aria-label="Stop and save"
          onClick={() => send("stop")}
          className={cn(btn, "bg-accent text-accent-foreground hover:bg-accent")}
        >
          <Square className="h-5 w-5" />
        </button>

        <button
          type="button"
          style={NO_DRAG_REGION}
          aria-label={`Camera size: ${CAMERA_SIZES[cameraIdx]} — click to change`}
          title={`Camera: ${CAMERA_SIZES[cameraIdx]}`}
          onClick={cycleCamera}
          className={btn}
        >
          <UserRound className="h-5 w-5" />
          <span className="sr-only">Camera size</span>
        </button>

        <button
          type="button"
          style={NO_DRAG_REGION}
          aria-label="Discard recording"
          onClick={() => send("cancel")}
          className={cn(btn, "text-muted-foreground")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </OverlayShell>
  );
}
