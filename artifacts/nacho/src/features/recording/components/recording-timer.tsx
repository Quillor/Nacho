import { cn } from "@/lib/utils";
import { formatDuration } from "@workspace/shared";
import { MAX_RECORDING_SECONDS } from "../hooks/use-recorder-session";

/**
 * The live recording clock overlaid on the preview. Shows elapsed time against
 * the fixed 30-minute cap and flips to a high-contrast destructive treatment as
 * the cap nears so the upcoming auto-stop is never a surprise.
 */
export function RecordingTimer({
  elapsed,
  paused,
  nearingLimit,
}: {
  elapsed: number;
  paused: boolean;
  nearingLimit: boolean;
}) {
  const muted = nearingLimit
    ? "text-destructive-foreground/80"
    : "text-muted-foreground";
  return (
    <div
      className={cn(
        "absolute left-4 top-4 flex items-center gap-2 border px-3 py-1.5",
        nearingLimit
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "border-foreground bg-background",
      )}
    >
      <span
        className={cn(
          "h-3 w-3 rounded-full",
          nearingLimit ? "bg-destructive-foreground" : "bg-destructive",
          !paused && "animate-pulse",
        )}
      />
      <span className="font-mono text-sm font-bold">
        {formatDuration(elapsed)}
        <span className={muted}>
          {" / "}
          {formatDuration(MAX_RECORDING_SECONDS)}
        </span>
      </span>
      {paused && <span className={cn("font-bold", muted)}>Paused</span>}
    </div>
  );
}
