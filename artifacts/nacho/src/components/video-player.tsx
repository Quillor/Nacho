import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Play, Pause, Captions, CaptionsOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/format";
import type { Chapter, TranscriptSegment } from "@/lib/types";

export interface VideoPlayerHandle {
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoElement: () => HTMLVideoElement | null;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  /** Optional chapter markers rendered on the scrub bar. */
  chapters?: Chapter[];
  /** Optional transcript segments used to drive the captions overlay. */
  transcript?: TranscriptSegment[];
  /** Clamp playback to a start offset (e.g. trim preview). */
  startTime?: number;
  /** Clamp playback to an end offset (e.g. trim preview). */
  endTime?: number;
  /** Show captions on by default when transcript data is present. */
  captionsDefault?: boolean;
  className?: string;
  /** Called whenever playback time changes. */
  onTimeUpdate?: (current: number) => void;
  /** Called once metadata loads with the media duration. */
  onDurationChange?: (duration: number) => void;
  /** Called when a chapter marker on the scrub bar is clicked. */
  onChapterClick?: (chapter: Chapter, index: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      poster,
      chapters = [],
      transcript = [],
      startTime = 0,
      endTime,
      captionsDefault = false,
      className,
      onTimeUpdate,
      onDurationChange,
      onChapterClick,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const hasCaptions = transcript.length > 0;
    const [captionsOn, setCaptionsOn] = useState(captionsDefault && hasCaptions);

    const lowerBound = startTime;
    const upperBound = endTime ?? duration;

    const clamp = useCallback(
      (t: number) => {
        const max = endTime ?? (duration || t);
        return Math.max(lowerBound, Math.min(max, t));
      },
      [lowerBound, endTime, duration],
    );

    const seek = useCallback(
      (t: number) => {
        const v = videoRef.current;
        if (!v) return;
        const next = clamp(t);
        v.currentTime = next;
        setCurrent(next);
      },
      [clamp],
    );

    const play = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      if (v.currentTime < lowerBound || (endTime && v.currentTime >= endTime)) {
        v.currentTime = lowerBound;
      }
      void v.play();
    }, [lowerBound, endTime]);

    const pause = useCallback(() => {
      videoRef.current?.pause();
    }, []);

    const togglePlay = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) play();
      else v.pause();
    }, [play]);

    useImperativeHandle(
      ref,
      () => ({
        seek,
        play,
        pause,
        togglePlay,
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        getDuration: () => videoRef.current?.duration ?? 0,
        getVideoElement: () => videoRef.current,
      }),
      [seek, play, pause, togglePlay],
    );

    const activeCaption = useMemo(() => {
      if (!captionsOn) return null;
      return (
        transcript.find((s) => current >= s.start && current < s.end)?.text ??
        null
      );
    }, [captionsOn, transcript, current]);

    const pct = (v: number) =>
      duration > 0 ? Math.max(0, Math.min(100, (v / duration) * 100)) : 0;

    const posToTime = (clientX: number) => {
      const el = trackRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      return ratio * duration;
    };

    useEffect(() => {
      const onMove = (e: PointerEvent) => {
        if (!dragging.current) return;
        seek(posToTime(e.clientX));
      };
      const onUp = () => {
        dragging.current = false;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, [seek, duration]);

    const playedPct = pct(current);

    return (
      <div className={cn("flex flex-col", className)}>
        <div className="relative overflow-hidden border-4 border-foreground bg-foreground shadow-md">
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            playsInline
            className="aspect-video w-full bg-foreground object-contain"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) {
                setDuration(d);
                onDurationChange?.(d);
              }
              if (startTime > 0) e.currentTarget.currentTime = startTime;
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (endTime && v.currentTime >= endTime) {
                v.pause();
                v.currentTime = lowerBound;
                setCurrent(lowerBound);
                setPlaying(false);
                onTimeUpdate?.(lowerBound);
                return;
              }
              setCurrent(v.currentTime);
              onTimeUpdate?.(v.currentTime);
            }}
            onClick={togglePlay}
          />

          {activeCaption ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
              <span className="max-w-[90%] border-2 border-foreground bg-background/90 px-3 py-1.5 text-center text-sm font-bold text-foreground shadow-sm">
                {activeCaption}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-foreground bg-primary text-primary-foreground shadow-sm transition-transform hover:translate-y-0.5"
          >
            {playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" />
            )}
          </button>

          <div
            ref={trackRef}
            className="relative h-4 flex-1 cursor-pointer border-2 border-foreground bg-muted"
            onPointerDown={(e) => {
              dragging.current = true;
              seek(posToTime(e.clientX));
            }}
          >
            {/* trim region shading */}
            {(startTime > 0 || endTime) && duration > 0 ? (
              <>
                {startTime > 0 ? (
                  <div
                    className="absolute inset-y-0 left-0 bg-foreground/20"
                    style={{ width: `${pct(startTime)}%` }}
                  />
                ) : null}
                {endTime ? (
                  <div
                    className="absolute inset-y-0 right-0 bg-foreground/20"
                    style={{ width: `${100 - pct(endTime)}%` }}
                  />
                ) : null}
              </>
            ) : null}

            {/* played progress */}
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{ width: `${playedPct}%` }}
            />

            {/* chapter markers */}
            {chapters.map((c, i) => (
              <button
                key={i}
                type="button"
                title={c.label || formatTimestamp(c.time)}
                aria-label={`Jump to ${c.label || formatTimestamp(c.time)}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  seek(c.time);
                  onChapterClick?.(c, i);
                }}
                className="absolute top-1/2 z-10 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 border-x border-foreground bg-secondary"
                style={{ left: `${pct(c.time)}%` }}
              />
            ))}

            {/* playhead */}
            <div
              className="pointer-events-none absolute top-1/2 z-20 h-5 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-foreground bg-background"
              style={{ left: `${playedPct}%` }}
            />
          </div>

          <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-foreground">
            {formatTimestamp(current)} / {formatTimestamp(upperBound)}
          </span>

          {hasCaptions ? (
            <button
              type="button"
              onClick={() => setCaptionsOn((v) => !v)}
              aria-pressed={captionsOn}
              aria-label={captionsOn ? "Hide captions" : "Show captions"}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-foreground shadow-sm transition-colors",
                captionsOn
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {captionsOn ? (
                <Captions className="h-4 w-4" />
              ) : (
                <CaptionsOff className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    );
  },
);
