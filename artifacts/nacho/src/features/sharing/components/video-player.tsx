import { forwardRef } from "react";
import { Play, Pause, Captions, CaptionsOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@workspace/shared";
import type { Chapter, TranscriptSegment, SelfieCorner } from "@/lib/types";
import { useVideoPlayer } from "../hooks/use-video-player";

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
  /**
   * Corner the selfie bubble sits in for this recording. When the selfie is in
   * the top-left, the chapter title is moved to the top-right so the two never
   * overlap. `null`/undefined falls back to the default top-left title.
   */
  selfieCorner?: SelfieCorner | null;
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
  function VideoPlayer(props, ref) {
    const {
      src,
      poster,
      showChapterTitles = false,
      selfieCorner = null,
      className,
    } = props;
    const p = useVideoPlayer(props, ref);

    const chapterFontSize = Math.max(
      11,
      Math.round(p.stageWidth * CHAPTER_OVERLAY_FONT_RATIO),
    );

    return (
      <div className={cn("flex flex-col", className)}>
        <div
          ref={p.stageRef}
          className="relative overflow-hidden border-2 border-foreground bg-foreground shadow-md"
        >
          <video
            ref={p.videoRef}
            src={src}
            poster={poster}
            playsInline
            className="block h-auto w-full bg-foreground"
            onLoadedMetadata={p.handleLoadedMetadata}
            onPlay={p.handlePlay}
            onPause={p.handlePause}
            onTimeUpdate={p.handleTimeUpdate}
            onClick={p.togglePlay}
          />

          {showChapterTitles && p.chapterTitle ? (
            <div
              className={cn(
                "pointer-events-none absolute top-0 max-w-[90%] p-[3%] transition-opacity duration-500",
                // When the selfie sits in the top-left, move the chapter title to
                // the top-right (right-aligned) so they never collide.
                selfieCorner === "top-left" ? "right-0 text-right" : "left-0",
                p.chapterVisible ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!p.chapterVisible}
            >
              <span
                className="inline-block whitespace-nowrap border border-foreground bg-primary px-[0.5em] py-[0.2em] font-display font-extrabold leading-tight text-primary-foreground shadow-sm"
                style={{ fontSize: `${chapterFontSize}px` }}
              >
                {p.chapterTitle}
              </span>
            </div>
          ) : null}

          {p.activeCaption ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
              <span className="max-w-[90%] border border-foreground bg-background/90 px-3 py-1.5 text-center text-sm font-bold text-foreground shadow-sm">
                {p.activeCaption}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={p.togglePlay}
            aria-label={p.playing ? "Pause" : "Play"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-accent text-accent-foreground shadow-sm transition-transform hover:translate-y-0.5"
          >
            {p.playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" />
            )}
          </button>

          <div
            ref={p.trackRef}
            className="relative h-4 flex-1 cursor-pointer border border-foreground bg-muted"
            onPointerDown={(e) => p.beginScrub(e.clientX)}
          >
            {/* played progress */}
            <div
              className="absolute inset-y-0 left-0 bg-accent"
              style={{ width: `${p.playedPct}%` }}
            />

            {/* chapter markers */}
            {p.chapters.map((c, i) => (
              <button
                key={i}
                type="button"
                title={c.label || formatTimestamp(c.time)}
                aria-label={`Jump to ${c.label || formatTimestamp(c.time)}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  p.handleChapterClick(c, i);
                }}
                className="absolute top-1/2 z-10 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 border-x border-foreground bg-primary"
                style={{ left: `${p.pct(c.time)}%` }}
              />
            ))}

            {/* playhead */}
            <div
              className="pointer-events-none absolute top-1/2 z-20 h-5 w-3 -translate-x-1/2 -translate-y-1/2 border border-foreground bg-background"
              style={{ left: `${p.playedPct}%` }}
            />
          </div>

          <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-foreground">
            {formatTimestamp(Math.max(0, p.current - p.lowerBound))} /{" "}
            {formatTimestamp(p.playableRange)}
          </span>

          {p.hasCaptions ? (
            <button
              type="button"
              onClick={() => p.setCaptionsOn((v) => !v)}
              aria-pressed={p.captionsOn}
              aria-label={p.captionsOn ? "Hide captions" : "Show captions"}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-foreground shadow-sm transition-colors",
                p.captionsOn
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {p.captionsOn ? (
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
