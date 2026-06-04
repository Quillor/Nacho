import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import {
  Scissors,
  Plus,
  Trash2,
  Globe,
  Lock,
  Loader2,
  Check,
  Copy,
  ArrowLeft,
  Captions,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  VideoPlayer,
  type VideoPlayerHandle,
} from "@/components/video-player";
import { useToast } from "@/hooks/use-toast";
import { getRecording, updateRecording } from "@/lib/db";
import {
  getPublicLink,
  unpublishRecording,
  syncPublishedRecording,
} from "@/lib/publish";
import { createGifFromBlob } from "@/lib/gif";
import { shareUrl } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LocalRecording, Chapter, Visibility } from "@/lib/types";

export default function Editor() {
  const [, params] = useRoute("/editor/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = params?.id;

  const [rec, setRec] = useState<LocalRecording | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const [visibility, setVisibility] = useState<Visibility>("private");
  const [shareId, setShareId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishStep, setPublishStep] = useState("");
  const [copied, setCopied] = useState(false);

  const playerRef = useRef<VideoPlayerHandle>(null);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    getRecording(id).then((r) => {
      if (!r) {
        setNotFound(true);
        return;
      }
      setRec(r);
      setTitle(r.title);
      setDescription(r.description);
      setTrimStart(r.trimStart);
      setTrimEnd(r.trimEnd || r.durationSec);
      setChapters(r.chapters);
      setVisibility(r.visibility);
      setShareId(r.shareId);
      url = URL.createObjectURL(r.blob);
      setObjectUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  const seek = (t: number) => playerRef.current?.seek(t);

  const addChapter = () => {
    const time = Math.round(current * 10) / 10;
    if (chapters.some((c) => Math.abs(c.time - time) < 0.5)) return;
    const next = [...chapters, { time, label: "New chapter" }].sort(
      (a, b) => a.time - b.time,
    );
    setChapters(next);
  };

  const updateChapter = (index: number, label: string) => {
    setChapters((prev) =>
      prev.map((c, i) => (i === index ? { ...c, label } : c)),
    );
  };

  const removeChapter = (index: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  const persist = async (): Promise<LocalRecording | undefined> => {
    if (!id) return undefined;
    return updateRecording(id, {
      title,
      description,
      trimStart,
      trimEnd,
      chapters,
    });
  };

  const handleSave = async () => {
    if (!rec) return;
    const trimChanged =
      trimStart !== rec.trimStart || trimEnd !== (rec.trimEnd || rec.durationSec);
    const updated = await persist();
    const saved = updated ?? rec;

    // Local-only recording: persist locally and we're done.
    if (saved.visibility !== "public" || !saved.shareId || !saved.videoPath) {
      toast({
        title: "Saved",
        description: "Your changes are stored locally.",
      });
      return;
    }

    // Already published: re-sync edits so the shared link stays current.
    setBusy(true);
    try {
      let gifBlob: Blob | null = null;
      if (trimChanged) {
        setPublishStep("Building preview…");
        try {
          gifBlob = await createGifFromBlob(saved.blob, {
            start: trimStart,
            end: Math.min(trimEnd, trimStart + 6),
          });
        } catch {
          gifBlob = null;
        }
      }
      const result = await syncPublishedRecording(saved, {
        gifBlob,
        onProgress: setPublishStep,
      });
      const synced = await updateRecording(saved.id, {
        gifPath: result.gifPath,
      });
      if (synced) setRec(synced);
      toast({
        title: "Saved & synced",
        description: "Your public link now shows the latest version.",
      });
    } catch {
      toast({
        title: "Saved locally",
        description: "Couldn't sync the public link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setPublishStep("");
    }
  };

  const handleGetLink = async () => {
    if (!rec) return;
    setBusy(true);
    try {
      const updated = await persist();
      const saved = updated ?? rec;
      const draft: LocalRecording = {
        ...saved,
        title,
        description,
        trimStart,
        trimEnd,
        chapters,
      };

      let gifBlob: Blob | null = null;
      if (!draft.shareId || !draft.videoPath) {
        setPublishStep("Building preview…");
        try {
          gifBlob = await createGifFromBlob(draft.blob, {
            start: trimStart,
            end: Math.min(trimEnd, trimStart + 6),
          });
        } catch {
          gifBlob = null;
        }
      }

      const result = await getPublicLink(draft, {
        gifBlob,
        onProgress: setPublishStep,
      });
      await updateRecording(draft.id, {
        visibility: result.visibility,
        shareId: result.shareId,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath,
        gifPath: result.gifPath,
      });
      setVisibility(result.visibility);
      setShareId(result.shareId);
      await navigator.clipboard.writeText(shareUrl(result.shareId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Public link ready",
        description: "Link copied — anyone with it can watch.",
      });
    } catch {
      toast({
        title: "Couldn't create link",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setPublishStep("");
    }
  };

  const handleUnpublish = async () => {
    if (!shareId) return;
    setBusy(true);
    try {
      await unpublishRecording(shareId);
      await updateRecording(rec!.id, { visibility: "private" });
      setVisibility("private");
      toast({
        title: "Made private",
        description: "The public link no longer works.",
      });
    } catch {
      toast({
        title: "Couldn't unpublish",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!shareId) return;
    await navigator.clipboard.writeText(shareUrl(shareId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trimmedDuration = useMemo(
    () => Math.max(0, trimEnd - trimStart),
    [trimStart, trimEnd],
  );

  const isPublic = visibility === "public" && !!shareId;

  if (notFound) {
    return (
      <AppShell>
        <div className="py-24 text-center">
          <h1 className="font-display text-4xl font-black uppercase">
            Recording not found
          </h1>
          <Button
            asChild
            className="mt-6 border-2 border-foreground bg-primary font-bold text-primary-foreground"
          >
            <Link href="/library">Back to Library</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!rec || !objectUrl) {
    return (
      <AppShell>
        <div className="aspect-video w-full animate-pulse border-4 border-foreground bg-muted" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Button
        variant="ghost"
        onClick={() => navigate("/library")}
        className="mb-4 font-bold uppercase text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Library
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <VideoPlayer
            ref={playerRef}
            src={objectUrl}
            chapters={chapters}
            transcript={rec.transcript}
            startTime={trimStart}
            endTime={trimEnd || undefined}
            onTimeUpdate={setCurrent}
            onDurationChange={(d) => {
              setDuration(d);
              if (!trimEnd) setTrimEnd(d);
            }}
          />

          <div className="mt-6 border-4 border-foreground bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              <h3 className="font-display text-lg font-bold uppercase">
                Trim · {formatTimestamp(trimmedDuration)}
              </h3>
            </div>
            <TrimBar
              duration={duration}
              start={trimStart}
              end={trimEnd}
              current={current}
              onStart={(v) => {
                setTrimStart(v);
                seek(v);
              }}
              onEnd={(v) => setTrimEnd(v)}
              onScrub={seek}
            />
            <div className="mt-2 flex justify-between font-mono text-xs font-bold text-muted-foreground">
              <span>{formatTimestamp(trimStart)}</span>
              <span>{formatTimestamp(trimEnd)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block font-display text-sm font-bold uppercase">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-4 border-foreground font-bold"
            />
          </div>

          <Tabs defaultValue="description">
            <TabsList className="grid w-full grid-cols-3 border-4 border-foreground bg-muted p-1">
              <TabsTrigger value="description" className="font-bold uppercase">
                Description
              </TabsTrigger>
              <TabsTrigger value="chapters" className="font-bold uppercase">
                Chapters
              </TabsTrigger>
              <TabsTrigger value="transcript" className="font-bold uppercase">
                Script
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add context, links, or next steps…"
              />
            </TabsContent>

            <TabsContent value="chapters" className="mt-4 space-y-3">
              <Button
                onClick={addChapter}
                variant="outline"
                className="w-full border-4 border-foreground font-bold uppercase"
              >
                <Plus className="mr-2 h-4 w-4" /> Add chapter at{" "}
                {formatTimestamp(current)}
              </Button>
              {chapters.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No chapters yet.
                </p>
              ) : (
                chapters.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border-2 border-foreground bg-card p-2"
                  >
                    <button
                      type="button"
                      onClick={() => seek(c.time)}
                      className="shrink-0 border-2 border-foreground bg-primary px-2 py-1 font-mono text-xs font-bold text-primary-foreground"
                    >
                      {formatTimestamp(c.time)}
                    </button>
                    <Input
                      value={c.label}
                      onChange={(e) => updateChapter(i, e.target.value)}
                      className="h-9 border-2 border-foreground font-medium"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChapter(i)}
                      className="shrink-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="transcript" className="mt-4">
              {rec.transcript.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                  <Captions className="mb-3 h-8 w-8" />
                  <p className="text-sm">
                    No transcript. Enable live captions when recording.
                  </p>
                </div>
              ) : (
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {rec.transcript.map((seg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => seek(seg.start)}
                      className="flex w-full gap-3 border-2 border-transparent p-2 text-left transition-colors hover:border-foreground hover:bg-muted"
                    >
                      <span className="shrink-0 font-mono text-xs font-bold text-foreground">
                        {formatTimestamp(seg.start)}
                      </span>
                      <span className="text-sm">{seg.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="space-y-3 border-t-4 border-foreground pt-6">
            {isPublic ? (
              <div className="space-y-3 border-4 border-foreground bg-secondary p-4 text-secondary-foreground">
                <div className="flex items-center gap-2 font-display font-bold uppercase">
                  <Globe className="h-5 w-5" /> Public
                </div>
                <p className="text-sm font-medium">
                  Anyone with the link can watch this recording.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl(shareId!)}
                    className="h-10 border-2 border-foreground bg-background font-mono text-xs"
                  />
                  <Button
                    onClick={copyLink}
                    className="h-10 shrink-0 border-2 border-foreground bg-primary font-bold text-primary-foreground"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => navigate(`/v/${shareId}`)}
                  variant="outline"
                  className="w-full border-2 border-foreground bg-background font-bold uppercase"
                >
                  Open public page
                </Button>
                <Button
                  onClick={handleUnpublish}
                  disabled={busy}
                  variant="ghost"
                  className="w-full font-bold uppercase"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Working…
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> Make private
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border-4 border-foreground bg-card p-4">
                <div className="flex items-center gap-2 font-display font-bold uppercase">
                  <Lock className="h-5 w-5" /> Private
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Only you can see this. Generate a link to share it.
                </p>
                <Button
                  onClick={handleGetLink}
                  disabled={busy}
                  size="lg"
                  className="h-14 w-full border-4 border-foreground bg-primary text-lg font-black uppercase text-primary-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {publishStep || "Working…"}
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-5 w-5" /> Get public link
                    </>
                  )}
                </Button>
              </div>
            )}
            <Button
              onClick={handleSave}
              variant="outline"
              className="w-full border-4 border-foreground font-bold uppercase"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TrimBar({
  duration,
  start,
  end,
  current,
  onStart,
  onEnd,
  onScrub,
}: {
  duration: number;
  start: number;
  end: number;
  current: number;
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
      className="relative h-12 w-full cursor-pointer border-2 border-foreground bg-muted"
      onPointerDown={(e) => {
        dragging.current = "scrub";
        onScrub(posToTime(e.clientX));
      }}
    >
      <div
        className="absolute inset-y-0 bg-primary/30"
        style={{ left: `${pct(start)}%`, width: `${pct(end - start)}%` }}
      />
      <div
        className="absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-background"
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
        "absolute inset-y-0 z-20 flex w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center border-x-2 border-foreground bg-secondary",
      )}
      style={{ left: `${position}%` }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDown();
      }}
    />
  );
}
