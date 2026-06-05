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

/**
 * Chapter overlay sizing. The font size is `CHAPTER_OVERLAY_FONT_RATIO` of the
 * player's rendered width. The character limit is *derived* from these same
 * constants — how many average glyphs (plus the box's horizontal padding) fit
 * inside the share of the player width the box may occupy — so a title at the
 * limit never overflows the video at any player size. Keep this the single
 * source of truth for both the font scaling and the label `maxLength`.
 */
export const CHAPTER_OVERLAY_FONT_RATIO = 0.035;
/** Conservative average glyph width (in em) for the bold display font. */
const OVERLAY_AVG_GLYPH_EM = 0.62;
/** Share of the player width the overlay box (text + padding) may occupy. */
const OVERLAY_USABLE_WIDTH_RATIO = 0.85;
/** Horizontal padding of the box, in em (matches the `px-[0.5em]` below ×2). */
const OVERLAY_PADDING_EM = 1;
export const CHAPTER_LABEL_MAX_CHARS = Math.floor(
  (OVERLAY_USABLE_WIDTH_RATIO / CHAPTER_OVERLAY_FONT_RATIO - OVERLAY_PADDING_EM) /
    OVERLAY_AVG_GLYPH_EM,
);

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
  /**
   * When true, the current chapter's title is briefly shown over the top-left
   * of the video each time playback crosses into a new chapter.
   */
  showChapterTitles?: boolean;
  /** Optional transcript segments used to drive the captions overlay. */
  transcript?: TranscriptSegment[];
  /** Clamp playback to a start offset (e.g. trim preview). */
  startTime?: number;
  /** Clamp playback to an end offset (e.g. trim preview). */
  endTime?: number;
  /**
   * Known media duration (seconds) from stored metadata. Used as a fallback
   * when the browser reports a non-finite duration (common for MediaRecorder
   * WebM blobs that report `Infinity`).
   */
  durationSec?: number;
  /** Show captions on by default when transcript data is present. */
  captionsDefault?: boolean;
  className?: string;
  /** Called whenever playback time changes. */
  onTimeUpdate?: (current: number) => void;
  /** Called once metadata loads with the media duration. */
  onDurationChange?: (duration: number) => void;
  /** Called when a chapter marker on the scrub bar is clicked. */
  onChapterClick?: (chapter: Chapter, index: number) => void;
  /** Called when playback actually starts (the video begins playing). */
  onPlay?: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      poster,
      chapters = [],
      showChapterTitles = false,
      transcript = [],
      startTime = 0,
      endTime,
      durationSec,
      captionsDefault = false,
      className,
      onTimeUpdate,
      onDurationChange,
      onChapterClick,
      onPlay,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [stageWidth, setStageWidth] = useState(0);
    const hasCaptions = transcript.length > 0;
    const [captionsOn, setCaptionsOn] = useState(captionsDefault && hasCaptions);

    // Title shown by the chapter overlay (kept during fade-out) and whether it
    // is currently visible (drives the opacity transition).
    const [chapterTitle, setChapterTitle] = useState<string | null>(null);
    const [chapterVisible, setChapterVisible] = useState(false);
    const lastChapterIndex = useRef(-1);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Index of the chapter the playhead currently sits in (-1 before the first).
    // Chapters are stored sorted by time; pick the last one at/under `current`.
    const activeChapterIndex = useMemo(() => {
      if (!showChapterTitles || chapters.length === 0) return -1;
      let idx = -1;
      for (let i = 0; i < chapters.length; i++) {
        if (current >= chapters[i].time) idx = i;
        else break;
      }
      return idx;
    }, [showChapterTitles, chapters, current]);

    // Crossing into a new chapter flashes its title for ~5s, then fades it out.
    useEffect(() => {
      if (!showChapterTitles) {
        lastChapterIndex.current = -1;
        setChapterVisible(false);
        return;
      }
      if (activeChapterIndex === lastChapterIndex.current) return;
      lastChapterIndex.current = activeChapterIndex;
      if (hideTimer.current) clearTimeout(hideTimer.current);

      const label =
        activeChapterIndex >= 0
          ? chapters[activeChapterIndex]?.label?.trim()
          : "";
      if (!label) {
        setChapterVisible(false);
        return;
      }
      setChapterTitle(label);
      setChapterVisible(true);
      hideTimer.current = setTimeout(() => setChapterVisible(false), 5000);
    }, [showChapterTitles, activeChapterIndex, chapters]);

    useEffect(
      () => () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
      },
      [],
    );

    // Track the player's rendered width so the overlay font scales with it.
    useEffect(() => {
      const el = stageRef.current;
      if (!el) return;
      setStageWidth(el.clientWidth);
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) setStageWidth(entry.contentRect.width);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const chapterFontSize = Math.max(
      11,
      Math.round(stageWidth * CHAPTER_OVERLAY_FONT_RATIO),
    );

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
        <div
          ref={stageRef}
          className="relative overflow-hidden border-4 border-foreground bg-foreground shadow-md"
        >
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            playsInline
            className="block h-auto w-full bg-foreground"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              const d = v.duration;
              if (Number.isFinite(d) && d > 0) {
                setDuration(d);
                onDurationChange?.(d);
                if (startTime > 0) v.currentTime = startTime;
                return;
              }
              // MediaRecorder WebM blobs often report `Infinity` here. Prefer
              // the known duration from stored metadata when available.
              if (durationSec && durationSec > 0) {
                setDuration(durationSec);
                onDurationChange?.(durationSec);
                if (startTime > 0) v.currentTime = startTime;
                return;
              }
              // Last resort: force the browser to compute the real duration by
              // seeking past the end, then restore the playhead.
              const fix = () => {
                const real = v.duration;
                if (Number.isFinite(real) && real > 0) {
                  v.removeEventListener("durationchange", fix);
                  setDuration(real);
                  onDurationChange?.(real);
                  v.currentTime = startTime;
                }
              };
              v.addEventListener("durationchange", fix);
              v.currentTime = 1e101;
            }}
            onPlay={() => {
              setPlaying(true);
              onPlay?.();
            }}
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

          {showChapterTitles && chapterTitle ? (
            <div
              className={cn(
                "pointer-events-none absolute left-0 top-0 max-w-[90%] p-[3%] transition-opacity duration-500",
                chapterVisible ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!chapterVisible}
            >
              <span
                className="inline-block whitespace-nowrap border-2 border-foreground bg-secondary px-[0.5em] py-[0.2em] font-display font-extrabold leading-tight text-secondary-foreground shadow-sm"
                style={{ fontSize: `${chapterFontSize}px` }}
              >
                {chapterTitle}
              </span>
            </div>
          ) : null}

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
