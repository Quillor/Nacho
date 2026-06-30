import {
  type ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Chapter } from "@/lib/types";
import type { VideoPlayerHandle, VideoPlayerProps } from "../components/video-player";

/**
 * Drives all playback state and behaviour for the VideoPlayer: play/pause/seek,
 * trim-range clamping, the captions overlay, the chapter-title flash, and the
 * scrub-bar geometry. The component is a thin view over the values returned here.
 *
 * Why a hook: the player owns a lot of imperative DOM/media logic (refs, an
 * imperative handle, window-level pointer dragging, a ResizeObserver) that would
 * dominate the JSX if left inline. Splitting it keeps both files focused.
 *
 * The forwarded `ref` is wired to the imperative handle here so callers (e.g. the
 * editor's seek-to-chapter/transcript) can drive playback.
 */
export function useVideoPlayer(
  {
    chapters = [],
    showChapterTitles = false,
    transcript = [],
    startTime = 0,
    endTime,
    durationSec,
    captionsDefault = false,
    onTimeUpdate,
    onDurationChange,
    onChapterClick,
    onPlay,
  }: VideoPlayerProps,
  ref: ForwardedRef<VideoPlayerHandle>,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stageWidth, setStageWidth] = useState(0);
  // True once the <video> element fails to load/decode the source — e.g. the
  // stored object is missing or truncated. Drives the "video unavailable"
  // overlay instead of leaving a dead play button on the public page.
  const [mediaError, setMediaError] = useState(false);
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

  // The scrub bar represents only the trimmed (playable) range: position 0%
  // is the trim start and 100% is the trim end. For untrimmed recordings this
  // is the whole clip (0 → duration).
  const playableRange = Math.max(0, upperBound - lowerBound);

  const pct = (v: number) =>
    playableRange > 0
      ? Math.max(0, Math.min(100, ((v - lowerBound) / playableRange) * 100))
      : 0;

  const posToTime = (clientX: number) => {
    const el = trackRef.current;
    if (!el || playableRange <= 0) return lowerBound;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return lowerBound + ratio * playableRange;
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

  // Begin a scrub drag from the track: arm the window-level pointer listeners
  // and jump straight to the pressed position.
  const beginScrub = (clientX: number) => {
    dragging.current = true;
    seek(posToTime(clientX));
  };

  const handleLoadedMetadata = (
    e: React.SyntheticEvent<HTMLVideoElement>,
  ) => {
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
  };

  const handlePlay = () => {
    setPlaying(true);
    onPlay?.();
  };

  const handlePause = () => setPlaying(false);

  const handleError = () => {
    setMediaError(true);
    setPlaying(false);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
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
  };

  const handleChapterClick = (chapter: Chapter, index: number) => {
    seek(chapter.time);
    onChapterClick?.(chapter, index);
  };

  return {
    videoRef,
    trackRef,
    stageRef,
    playing,
    current,
    mediaError,
    captionsOn,
    setCaptionsOn,
    hasCaptions,
    chapterTitle,
    chapterVisible,
    stageWidth,
    activeCaption,
    lowerBound,
    playableRange,
    pct,
    playedPct,
    chapters,
    seek,
    togglePlay,
    beginScrub,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleError,
    handleTimeUpdate,
    handleChapterClick,
  };
}
