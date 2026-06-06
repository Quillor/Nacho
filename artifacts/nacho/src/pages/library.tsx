import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CircleDot,
  Play,
  Trash2,
  Share2,
  Globe,
  Lock,
  Link2,
  Eye,
  Loader2,
  Pencil,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  RotateCcw,
  Pin,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@workspace/pico-ui/button";
import { Badge } from "@workspace/pico-ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/pico-ui/alert-dialog";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  listRecordings,
  deleteRecording,
  getRecording,
  updateRecording,
} from "@/lib/db";
import {
  getPublicLink,
  unpublishRecording,
  deleteServerRecording,
} from "@/lib/publish";
import {
  useUploadState,
  waitForUpload,
  isUploadInFlight,
  cancelUpload,
  retryUpload,
} from "@/lib/upload-manager";
import { shareUrl } from "@/lib/api";
import { formatDuration, formatRelativeDate } from "@/lib/format";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";
import type { LocalRecordingMeta } from "@/lib/types";

function Thumb({ rec }: { rec: LocalRecordingMeta }) {
  const url = useMemo(
    () => (rec.thumbnail ? URL.createObjectURL(rec.thumbnail) : null),
    [rec.thumbnail],
  );
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <div className="relative aspect-video w-full overflow-hidden border-b-4 border-foreground bg-muted">
      {url ? (
        <img
          src={url}
          alt={rec.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Play className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <span className="absolute bottom-2 right-2 rounded-sm border-2 border-foreground bg-background px-2 py-0.5 font-mono text-xs font-bold">
        {formatDuration(rec.trimEnd - rec.trimStart)}
      </span>
    </div>
  );
}

/** Background-upload status for one library card (subscribes to the manager). */
function UploadStatus({ id }: { id: string }) {
  const upload = useUploadState(id);
  if (upload.phase === "uploading") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <UploadCloud className="h-3.5 w-3.5 animate-pulse" />
        Saving to cloud… {Math.round(upload.progress * 100)}%
      </span>
    );
  }
  if (upload.phase === "uploaded") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" /> Saved — instant sharing
      </span>
    );
  }
  if (upload.phase === "failed") {
    return (
      <button
        type="button"
        onClick={() => retryUpload(id)}
        className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:underline"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Upload failed — retry
      </button>
    );
  }
  return null;
}

export default function LibraryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<LocalRecordingMeta[] | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const refresh = () => {
    // listRecordings already returns newest-first; keep that order within each
    // group and float pinned recordings to the top.
    listRecordings().then((recs) =>
      setRecordings(
        [...recs].sort(
          (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false),
        ),
      ),
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  // Dev-only: seed sample recordings once when the bypass is on and the Library
  // is empty. The dynamic import keeps lib/dev-seed out of production bundles.
  useEffect(() => {
    if (!isDevAuthBypassEnabled()) return;
    let cancelled = false;
    import("@/lib/dev-seed")
      .then(async ({ autoSeedIfEmpty }) => {
        const created = await autoSeedIfEmpty();
        if (created > 0 && !cancelled) refresh();
      })
      .catch(() => {
        /* seeding is best-effort in dev */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { seedSampleRecordings } = await import("@/lib/dev-seed");
      const created = await seedSampleRecordings();
      refresh();
      toast({
        title: "Sample recordings added",
        description: `Seeded ${created} recordings into your Library.`,
      });
    } catch {
      toast({
        title: "Couldn't seed recordings",
        description: "Sample generation failed. Check the console.",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleTogglePin = async (rec: LocalRecordingMeta) => {
    const next = !rec.pinned;
    await updateRecording(rec.id, { pinned: next });
    refresh();
    toast({
      title: next ? "Pinned to top" : "Unpinned",
      description: next
        ? "This recording now stays at the top of your Library."
        : "This recording returns to its usual spot.",
    });
  };

  const handleCopy = async (shareId: string) => {
    await navigator.clipboard.writeText(shareUrl(shareId));
    toast({ title: "Link copied", description: "Share it anywhere." });
  };

  const handleGetLink = async (rec: LocalRecordingMeta) => {
    setBusyId(rec.id);
    try {
      // Reuse the background upload: wait for the in-flight transfer to finish
      // so getPublicLink just syncs metadata + flips visibility instead of
      // re-uploading the whole video.
      if (isUploadInFlight(rec.id)) await waitForUpload(rec.id);
      const full = await getRecording(rec.id);
      if (!full) throw new Error("missing recording");
      const result = await getPublicLink(full);
      await updateRecording(rec.id, {
        visibility: "public",
        shareId: result.shareId,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath,
        gifPath: result.gifPath,
      });
      await navigator.clipboard.writeText(shareUrl(result.shareId));
      refresh();
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
      setBusyId(null);
    }
  };

  const handleUnpublish = async (rec: LocalRecordingMeta) => {
    if (!rec.shareId) return;
    setBusyId(rec.id);
    try {
      await unpublishRecording(rec.shareId);
      await updateRecording(rec.id, { visibility: "private" });
      refresh();
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
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    // Reload the full record so we have the freshest shareId — a background
    // upload may have persisted one after the list snapshot was taken.
    const full = await getRecording(id);
    // Stop any in-flight upload; if the server record already exists, the
    // upload task removes it on abort.
    cancelUpload(id);
    await deleteRecording(id);
    // Clean up the server-side record for an already-uploaded private recording
    // so it doesn't dangle. Best-effort — the local copy is already gone.
    if (full?.shareId) {
      void deleteServerRecording(full.shareId).catch(() => undefined);
    }
    setPendingDelete(null);
    refresh();
    toast({ title: "Recording deleted" });
  };

  return (
    <AppShell>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">
            Your Library
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isDevAuthBypassEnabled() && (
            <Button
              size="lg"
              variant="outline"
              disabled={seeding}
              onClick={handleSeed}
              className="h-14 border-4 border-foreground px-6 text-lg font-bold"
            >
              {seeding ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              Seed samples
            </Button>
          )}
          <Button
            asChild
            size="lg"
            className="h-14 border-4 border-foreground bg-accent px-6 text-lg font-bold text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
          >
            <Link href="/studio">
              <CircleDot className="mr-2 h-5 w-5" />
              New Recording
            </Link>
          </Button>
        </div>
      </div>

      {recordings === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-video animate-pulse border-4 border-foreground bg-muted"
            />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-4 border-dashed border-foreground bg-card py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-foreground bg-accent shadow-md">
            <CircleDot className="h-10 w-10 text-accent-foreground" />
          </div>
 <h2 className="font-display text-3xl font-extrabold">
            No recordings yet
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Hit record, talk it out, and your video will show up right here.
          </p>
          <Button
            asChild
            size="lg"
 className="mt-8 h-14 border-4 border-foreground bg-accent px-8 text-lg font-bold text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
          >
            <Link href="/studio">Start Recording</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((rec) => (
            <div
              key={rec.id}
              className="group relative flex flex-col border-4 border-foreground bg-card shadow-md transition-transform hover:-translate-y-1"
            >
              <button
                type="button"
                onClick={() => handleTogglePin(rec)}
                aria-pressed={rec.pinned}
                title={rec.pinned ? "Unpin recording" : "Pin recording"}
                className={`absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-sm border-2 border-foreground shadow-sm transition-colors ${
                  rec.pinned
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {rec.pinned ? (
                  <Pin className="h-4 w-4 fill-current" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {rec.pinned ? "Unpin recording" : "Pin recording"}
                </span>
              </button>
              <button
                type="button"
                className="block text-left"
                onClick={() => navigate(`/editor/${rec.id}`)}
              >
                <Thumb rec={rec} />
              </button>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  {rec.visibility === "public" ? (
                    <Badge className="border-2 border-foreground bg-primary text-primary-foreground">
                      <Globe className="mr-1 h-3 w-3" /> Public
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-2 border-foreground"
                    >
                      <Lock className="mr-1 h-3 w-3" /> Private
                    </Badge>
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatRelativeDate(rec.createdAt)}
                  </span>
                </div>
 <h3 className="font-display text-xl font-bold leading-tight">
                  {rec.title}
                </h3>

                {rec.visibility !== "public" && (
                  <div className="mt-2">
                    <UploadStatus id={rec.id} />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-2 border-foreground font-bold"
                    onClick={() => navigate(`/editor/${rec.id}`)}
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  {rec.visibility === "public" && rec.shareId ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-foreground font-bold"
                        onClick={() => navigate(`/v/${rec.shareId}`)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                      <Button
                        size="sm"
                        className="border-2 border-foreground bg-accent font-bold text-accent-foreground"
                        onClick={() => handleCopy(rec.shareId!)}
                      >
                        <Share2 className="mr-1 h-4 w-4" /> Copy link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-foreground font-bold"
                        disabled={busyId === rec.id}
                        onClick={() => handleUnpublish(rec)}
                      >
                        {busyId === rec.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="mr-1 h-4 w-4" />
                        )}
                        Unpublish
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="border-2 border-foreground bg-accent font-bold text-accent-foreground"
                      disabled={busyId === rec.id}
                      onClick={() => handleGetLink(rec)}
                    >
                      {busyId === rec.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="mr-1 h-4 w-4" />
                      )}
                      Get public link
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setPendingDelete(rec.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="border-4 border-foreground">
          <AlertDialogHeader>
 <AlertDialogTitle className="font-display">
              Delete this recording?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the local copy from this device. Published share links
              will keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-foreground font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="border-2 border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
