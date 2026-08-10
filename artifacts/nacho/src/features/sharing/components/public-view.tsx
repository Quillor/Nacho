import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useRoute, Link } from "wouter";
import { Copy, Check, List, FileText } from "lucide-react";
import {
  useGetRecording,
  useAddRecordingView,
  getGetRecordingQueryKey,
  useGetRecordingPlaybackUrl,
  getGetRecordingPlaybackUrlQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@workspace/pico-ui/button";
import { Logo } from "@/components/logo";
import { VideoPlayer, type VideoPlayerHandle } from "./video-player";
import { TranscriptPanel } from "./transcript-panel";
import { CommentsSection } from "./comments-section";
import type { RecordingComment } from "../hooks/use-comments";
import { storageUrl, shareUrl } from "@/lib/api";
import { formatTimestamp, formatRelativeDate } from "@workspace/shared";

export function PublicView() {
  const [, params] = useRoute("/v/:shareId");
  const shareId = params?.shareId ?? "";

  // The server enforces the privacy model: public recordings resolve for
  // anyone, private ones only for the signed-in author. Sending credentials
  // lets it identify the owner; a non-match comes back as a clean 404.
  const {
    data: rec,
    isError,
    isLoading,
  } = useGetRecording(shareId, {
    request: { credentials: "include" },
    query: {
      queryKey: getGetRecordingQueryKey(shareId),
      enabled: !!shareId,
      retry: false,
    },
  });

  // Videos stream straight from object storage via a short-lived signed URL —
  // the API server only signs, it doesn't proxy the bytes (which used to make
  // playback stall under load). Falls back to the server proxy if signing is
  // unavailable (e.g. an older server).
  const playback = useGetRecordingPlaybackUrl(shareId, {
    request: { credentials: "include" },
    query: {
      queryKey: getGetRecordingPlaybackUrlQueryKey(shareId),
      enabled: !!shareId && !!rec,
      retry: 1,
      // Signed URLs expire; don't cache one past its useful life.
      staleTime: 30 * 60 * 1000,
    },
  });
  const videoSrc =
    playback.data?.url ?? (rec ? storageUrl(rec.videoPath) : undefined);

  const addView = useAddRecordingView({ request: { credentials: "include" } });
  const viewCounted = useRef(false);
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [copied, setCopied] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  // Playhead position, for the transcript panel's active-line highlight.
  const [currentTime, setCurrentTime] = useState(0);
  // Open comments, mirrored up from the comments section for timeline markers.
  const [openComments, setOpenComments] = useState<RecordingComment[]>([]);

  const scrollToComment = (id: number) => {
    document
      .getElementById(`comment-${id}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  // A view counts only when the share link is opened AND playback actually
  // starts — not on mere page load. Dedupe to once per viewing session.
  const handlePlay = () => {
    if (!shareId || !rec || viewCounted.current) return;
    viewCounted.current = true;
    addView.mutate({ shareId });
  };

  const seek = (t: number) => {
    playerRef.current?.seek(t);
    playerRef.current?.play();
  };

  const copyLink = async () => {
    if (!shareId) return;
    await navigator.clipboard.writeText(shareUrl(shareId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasTranscript = (rec?.transcript.length ?? 0) > 0;

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground">
      <header data-pico-section="header" className="border-b-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-8" />
          </Link>
          {rec && (
            <Button
              onClick={copyLink}
 className="border border-foreground bg-accent font-bold text-accent-foreground"
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy link
            </Button>
          )}
        </div>
      </header>

      <main data-pico-section="recording" className="mx-auto max-w-5xl px-6 py-10">
        {isError || !shareId ? (
          <div className="py-24 text-center">
 <h1 className="font-display text-4xl font-extrabold">
              This recording isn&apos;t available
            </h1>
            <p className="mt-2 text-muted-foreground">
              It may be private, or the link may have been removed.
            </p>
          </div>
        ) : !rec || isLoading || (playback.isLoading && !playback.isError) ? (
          <div className="aspect-video w-full animate-pulse border-2 border-foreground bg-muted" />
        ) : (
          <>
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="min-w-0 flex-1 space-y-6">
                <h1 className="font-display text-4xl font-extrabold leading-tight">
                  {rec.title}
                </h1>

                <VideoPlayer
                  ref={playerRef}
                  src={videoSrc ?? storageUrl(rec.videoPath)}
                  poster={
                    rec.thumbnailPath
                      ? storageUrl(rec.thumbnailPath)
                      : undefined
                  }
                  chapters={rec.chapters}
                  showChapterTitles={rec.displayChaptersOnVideo}
                  selfieCorner={rec.selfieCorner}
                  transcript={rec.transcript}
                  startTime={rec.trimStart}
                  endTime={rec.trimEnd || undefined}
                  durationSec={rec.durationSec}
                  hasAudio={rec.hasAudio}
                  captionsDefault
                  onPlay={handlePlay}
                  onTimeUpdate={setCurrentTime}
                  commentMarkers={openComments.map((c) => ({
                    id: c.id,
                    time: c.timeSec,
                    label: `${c.authorName}: ${c.body.slice(0, 60)}`,
                  }))}
                  onCommentMarkerClick={scrollToComment}
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm font-bold text-muted-foreground">
                    {formatRelativeDate(new Date(rec.createdAt).getTime())}
                  </p>
                  {hasTranscript && (
                    <Button
                      onClick={() => setTranscriptOpen((o) => !o)}
                      aria-pressed={transcriptOpen}
 className="border border-foreground bg-card font-bold text-foreground hover:bg-muted"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {transcriptOpen ? "Hide transcript" : "Transcript"}
                    </Button>
                  )}
                </div>

                {rec.description && (
                  <div
                    className="prose prose-sm max-w-none prose-headings:font-display prose-a:font-bold prose-a:text-foreground prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(rec.description),
                    }}
                  />
                )}

                {rec.chapters.length > 0 && (
                  <div>
 <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
                      <List className="h-5 w-5" /> Chapters
                    </h2>
                    <div className="space-y-1 border-2 border-foreground bg-card p-4">
                      {rec.chapters.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => seek(c.time)}
                          className="flex w-full items-center gap-3 border border-transparent p-2 text-left transition-colors hover:border-foreground hover:bg-muted"
                        >
                          <span className="shrink-0 border border-foreground bg-accent px-2 py-0.5 font-mono text-xs font-bold text-accent-foreground">
                            {formatTimestamp(c.time)}
                          </span>
                          <span className="font-medium">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <CommentsSection
                  shareId={shareId}
                  currentTime={currentTime}
                  onSeek={seek}
                  onCommentsChanged={setOpenComments}
                />
              </div>

              {hasTranscript && transcriptOpen && (
                <TranscriptPanel
                  transcript={rec.transcript}
                  currentTime={currentTime}
                  onSeek={seek}
                  onClose={() => setTranscriptOpen(false)}
                />
              )}
            </div>

            <div data-pico-section="cta" className="mt-16 flex flex-col items-center gap-4 border-t-2 border-foreground py-10 text-center">
 <p className="font-display text-2xl font-extrabold">
                Made with Nacho
              </p>
              <Button
                asChild
                size="lg"
 className="h-14 border-2 border-foreground bg-accent px-8 text-lg font-bold text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
              >
                <Link href="/studio">Record your own</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
