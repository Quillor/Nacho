import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useRoute, Link } from "wouter";
import { Eye, Copy, Check, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { storageUrl, shareUrl } from "@/lib/api";
import { formatTimestamp, formatRelativeDate } from "@/lib/format";
import type { Chapter, TranscriptSegment } from "@/lib/types";

interface PublicRecording {
  shareId: string;
  title: string;
  description: string;
  durationSec: number;
  trimStart: number;
  trimEnd: number;
  hasAudio: boolean;
  videoPath: string;
  thumbnailPath: string | null;
  gifPath: string | null;
  chapters: Chapter[];
  transcript: TranscriptSegment[];
  views: number;
  createdAt: string;
}

export default function PublicView() {
  const [, params] = useRoute("/v/:shareId");
  const shareId = params?.shareId;

  const [rec, setRec] = useState<PublicRecording | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewCounted = useRef(false);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/recordings/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data: PublicRecording) => setRec(data))
      .catch(() => setError(true));
  }, [shareId]);

  useEffect(() => {
    if (!shareId || !rec || viewCounted.current) return;
    viewCounted.current = true;
    fetch(`/api/recordings/${shareId}/views`, { method: "POST" }).catch(
      () => undefined,
    );
  }, [shareId, rec]);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    void v.play();
  };

  const copyLink = async () => {
    if (!shareId) return;
    await navigator.clipboard.writeText(shareUrl(shareId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-foreground">
      <header className="border-b-4 border-foreground bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-8" />
          </Link>
          {rec && (
            <Button
              onClick={copyLink}
              className="border-2 border-foreground bg-primary font-bold uppercase text-primary-foreground"
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {error ? (
          <div className="py-24 text-center">
            <h1 className="font-display text-4xl font-black uppercase">
              Recording not found
            </h1>
            <p className="mt-2 text-muted-foreground">
              This link may have been removed.
            </p>
          </div>
        ) : !rec ? (
          <div className="aspect-video w-full animate-pulse border-4 border-foreground bg-muted" />
        ) : (
          <>
            <div className="overflow-hidden border-4 border-foreground bg-foreground shadow-md">
              <video
                ref={videoRef}
                src={storageUrl(rec.videoPath)}
                poster={
                  rec.thumbnailPath ? storageUrl(rec.thumbnailPath) : undefined
                }
                controls
                playsInline
                className="aspect-video w-full bg-foreground object-contain"
                onLoadedMetadata={(e) => {
                  if (rec.trimStart > 0) e.currentTarget.currentTime = rec.trimStart;
                }}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-display text-4xl font-black uppercase leading-tight">
                {rec.title}
              </h1>
              <div className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-1.5 font-bold">
                <Eye className="h-4 w-4" /> {rec.views}
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatRelativeDate(new Date(rec.createdAt).getTime())}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-8">
                {rec.description && (
                  <div
                    className="prose prose-sm max-w-none prose-headings:font-display prose-a:text-primary"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(rec.description),
                    }}
                  />
                )}

                {rec.transcript.length > 0 && (
                  <div>
                    <h2 className="mb-3 font-display text-2xl font-black uppercase">
                      Transcript
                    </h2>
                    <div className="space-y-2 border-4 border-foreground bg-card p-4">
                      {rec.transcript.map((seg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => seek(seg.start)}
                          className="flex w-full gap-3 border-2 border-transparent p-2 text-left transition-colors hover:border-foreground hover:bg-muted"
                        >
                          <span className="shrink-0 font-mono text-xs font-bold text-primary">
                            {formatTimestamp(seg.start)}
                          </span>
                          <span className="text-sm">{seg.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside>
                {rec.chapters.length > 0 && (
                  <div className="border-4 border-foreground bg-card p-4">
                    <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-black uppercase">
                      <List className="h-5 w-5" /> Chapters
                    </h2>
                    <div className="space-y-1">
                      {rec.chapters.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => seek(c.time)}
                          className="flex w-full items-center gap-3 border-2 border-transparent p-2 text-left transition-colors hover:border-foreground hover:bg-muted"
                        >
                          <span className="shrink-0 border-2 border-foreground bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                            {formatTimestamp(c.time)}
                          </span>
                          <span className="font-medium">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>

            <div className="mt-16 flex flex-col items-center gap-4 border-t-4 border-foreground py-10 text-center">
              <p className="font-display text-2xl font-black uppercase">
                Made with Nacho
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 border-4 border-foreground bg-primary px-8 text-lg font-bold uppercase text-primary-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
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
