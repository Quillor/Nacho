import { useEffect, useRef } from "react";
import { FileText, X } from "lucide-react";
import { formatTimestamp } from "@workspace/shared";
import { cn } from "@/lib/utils";
import type { TranscriptSegment } from "@/lib/types";

/**
 * YouTube-style transcript rail: every segment is clickable to jump, the
 * segment under the playhead is highlighted, and the list auto-scrolls to keep
 * the active line in view while the video plays.
 */
export function TranscriptPanel({
  transcript,
  currentTime,
  onSeek,
  onClose,
}: {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
}) {
  // Active line = the segment containing the playhead, or the last one that
  // has already started (so gaps between segments keep the previous line lit).
  let activeIndex = -1;
  for (let i = 0; i < transcript.length; i++) {
    if (transcript[i].start <= currentTime) activeIndex = i;
    else break;
  }
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const lastAutoScrolled = useRef(-1);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex === lastAutoScrolled.current) return;
    lastAutoScrolled.current = activeIndex;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <aside className="shrink-0 lg:w-80">
      <div className="border-2 border-foreground bg-card lg:sticky lg:top-6">
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <FileText className="h-5 w-5" /> Transcript
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transcript"
            className="flex h-8 w-8 items-center justify-center border border-foreground bg-background transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div ref={listRef} className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
          {transcript.map((seg, i) => (
            <button
              key={i}
              type="button"
              ref={i === activeIndex ? activeRef : undefined}
              onClick={() => onSeek(seg.start)}
              aria-current={i === activeIndex ? "true" : undefined}
              className={cn(
                "flex w-full gap-3 border p-2 text-left transition-colors",
                i === activeIndex
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-transparent hover:border-foreground hover:bg-muted",
              )}
            >
              <span className="shrink-0 font-mono text-xs font-bold">
                {formatTimestamp(seg.start)}
              </span>
              <span className="text-sm">{seg.text}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
