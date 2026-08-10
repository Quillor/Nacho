import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { isDevAuthBypassEnabled } from "@workspace/shared";
import {
  listRecordings,
  deleteRecording,
  getRecording,
  updateRecording,
} from "@/lib/db";
import {
  getPublicLink,
  unpublishRecording,
  publishExistingRecording,
  deleteServerRecording,
  waitForUpload,
  isUploadInFlight,
  cancelUpload,
} from "@/features/publishing";
import { shareUrl } from "@/lib/api";
import { fetchServerRecordings, mergeLibraries } from "./library-server";
import type { LibraryItem } from "@/lib/types";

/** Sort options offered by the Library's sort control. */
export type LibrarySort = "pinned" | "newest" | "oldest" | "title";

/**
 * State and actions for the Library page: loading the local recording list,
 * pin/delete, and the publish lifecycle (get public link / unpublish). The
 * publish actions piggyback on the background upload manager so a "Get public
 * link" only syncs metadata when the video is already uploading/uploaded
 * instead of re-uploading the whole blob.
 */
export function useLibrary() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<LibraryItem[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LibrarySort>("pinned");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const refresh = () => {
    // Show the local list immediately (fast path), then merge in cloud-only
    // recordings once the server responds so recordings made on other devices
    // — or whose local copy was cleared — still show up.
    listRecordings().then((recs) => {
      setRecordings((prev) => (prev === null ? recs : prev));
      fetchServerRecordings().then((server) => {
        setRecordings(mergeLibraries(recs, server));
      });
    });
  };

  // Derived view for the grid: filter by the search query, then sort. The raw
  // `recordings` list is kept intact so the page can tell "no recordings at all"
  // apart from "no search matches".
  const visibleRecordings = useMemo(() => {
    if (recordings === null) return null;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? recordings.filter((r) => r.title.toLowerCase().includes(q))
      : recordings;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "title":
          return a.title.localeCompare(b.title);
        case "pinned":
        default:
          // Pinned first, then newest within each group.
          return (
            Number(b.pinned ?? false) - Number(a.pinned ?? false) ||
            b.createdAt - a.createdAt
          );
      }
    });
    return sorted;
  }, [recordings, query, sort]);

  useEffect(() => {
    refresh();
  }, []);

  // Dev-only: seed sample recordings once when the bypass is on and the Library
  // is empty. The dynamic import keeps dev-seed out of production bundles.
  useEffect(() => {
    if (!isDevAuthBypassEnabled()) return;
    let cancelled = false;
    import("../dev-seed")
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
      const { seedSampleRecordings } = await import("../dev-seed");
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

  const handleTogglePin = async (rec: LibraryItem) => {
    if (rec.remote) return; // pinning is a device-local concept
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

  const handleGetLink = async (rec: LibraryItem) => {
    setBusyId(rec.id);
    try {
      // Cloud-only entry: the media already lives on the server — just flip
      // visibility and hand over the link.
      if (rec.remote && rec.shareId) {
        await publishExistingRecording(rec.shareId);
        await navigator.clipboard.writeText(shareUrl(rec.shareId));
        refresh();
        toast({
          title: "Public link ready",
          description: "Link copied — anyone with it can watch.",
        });
        return;
      }
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

  const handleUnpublish = async (rec: LibraryItem) => {
    if (!rec.shareId) return;
    setBusyId(rec.id);
    try {
      await unpublishRecording(rec.shareId);
      if (!rec.remote) await updateRecording(rec.id, { visibility: "private" });
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

  // Shared per-recording cleanup used by both single and bulk delete: stop any
  // in-flight upload, remove the local IndexedDB copy, then best-effort remove
  // the dangling server-side record for an already-uploaded recording.
  const deleteOne = async (id: string) => {
    // Cloud-only entry: there's no local copy — just remove the server record.
    if (id.startsWith("remote-")) {
      await deleteServerRecording(id.slice("remote-".length)).catch(
        () => undefined,
      );
      return;
    }
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
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteOne(pendingDelete);
    setPendingDelete(null);
    refresh();
    toast({ title: "Recording deleted" });
  };

  const toggleSelectionMode = () => {
    setSelectionMode((on) => {
      // Leaving selection mode clears any pending selection.
      if (on) setSelectedIds(new Set());
      return !on;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set((visibleRecordings ?? []).map((r) => r.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => deleteOne(id)));
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      setSelectionMode(false);
      refresh();
      toast({
        title:
          ids.length === 1
            ? "Recording deleted"
            : `${ids.length} recordings deleted`,
      });
    } catch {
      refresh();
      toast({
        title: "Couldn't delete some recordings",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  return {
    recordings,
    visibleRecordings,
    query,
    setQuery,
    sort,
    setSort,
    pendingDelete,
    setPendingDelete,
    busyId,
    seeding,
    navigate,
    handleSeed,
    handleTogglePin,
    handleCopy,
    handleGetLink,
    handleUnpublish,
    handleDelete,
    selectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkDeleting,
    toggleSelectionMode,
    toggleSelected,
    selectAllVisible,
    clearSelection,
    handleBulkDelete,
  };
}
