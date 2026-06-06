import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// QuickTime-style trim scrubber: a filmstrip track with draggable start/end
// handles and a playhead. Pointer drags are tracked on the window so a drag that
// leaves the track keeps working until pointer-up.
export function TrimBar({
  duration,
  start,
  end,
  current,
  filmstrip = [],
  onStart,
  onEnd,
  onScrub,
}: {
  duration: number;
  start: number;
  end: number;
  current: number;
  filmstrip?: string[];
  onStart: (v: number) => void;
  onEnd: (v: number) => void;
  onScrub: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | "scrub" | null>(null);

  const pct = (v: number) => (duration > 0 ? (v / duration) * 100 : 0);

  const posToTime = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const t = posToTime(e.clientX);
      if (dragging.current === "start") onStart(Math.min(t, end - 0.2));
      else if (dragging.current === "end") onEnd(Math.max(t, start + 0.2));
      else onScrub(t);
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, start, end]);

  return (
    <div
      ref={trackRef}
      className="relative h-12 w-full cursor-pointer overflow-hidden border border-foreground bg-muted"
      onPointerDown={(e) => {
        dragging.current = "scrub";
        onScrub(posToTime(e.clientX));
      }}
    >
      {/* QuickTime-style filmstrip of sampled frames */}
      {filmstrip.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 flex">
          {filmstrip.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              draggable={false}
              className="h-full min-w-0 flex-1 object-cover"
            />
          ))}
        </div>
      ) : null}

      {/* dim the trimmed-away regions */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-background/70"
        style={{ width: `${pct(start)}%` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 bg-background/70"
        style={{ width: `${100 - pct(end)}%` }}
      />

      <div
        className="pointer-events-none absolute inset-y-0 bg-accent/30"
        style={{ left: `${pct(start)}%`, width: `${pct(end - start)}%` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 z-30 w-3 -translate-x-1/2 border border-foreground bg-background"
        style={{ left: `${pct(current)}%` }}
      />
      <Handle position={pct(start)} onDown={() => (dragging.current = "start")} />
      <Handle position={pct(end)} onDown={() => (dragging.current = "end")} />
    </div>
  );
}

function Handle({
  position,
  onDown,
}: {
  position: number;
  onDown: () => void;
}) {
  return (
    <div
      role="slider"
      aria-valuenow={position}
      tabIndex={0}
      className={cn(
        "absolute inset-y-0 z-20 flex w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center border-x border-foreground bg-primary",
      )}
      style={{ left: `${position}%` }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDown();
      }}
    />
  );
}
