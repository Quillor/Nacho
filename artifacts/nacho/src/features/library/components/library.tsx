import { Link } from "wouter";
import {
  CircleDot,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import emptyBowlNacho from "@workspace/nacho-illustrations/assets/sad-nacho-empty-bowl.webp";
import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/pico-ui/select";
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
import { isDevAuthBypassEnabled } from "@workspace/shared";
import { isDesktop, openExternalUrl } from "@/lib/desktop";
import { apiOrigin } from "@/lib/desktop-api";
import { useLibrary, type LibrarySort } from "../hooks/use-library";
import { RecordingCard } from "./recording-card";

const SORT_LABELS: Record<LibrarySort, string> = {
  pinned: "Pinned first",
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title (A–Z)",
};

/** The Library: a grid of locally-stored recordings with publish/pin/delete. */
export function LibraryPage() {
  const {
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
    handleDownload,
    handleDelete,
    selectionMode,
    selectedIds,
    selectedCount,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkDeleting,
    toggleSelectionMode,
    toggleSelected,
    selectAllVisible,
    clearSelection,
    handleBulkDelete,
  } = useLibrary();

  const hasRecordings = recordings !== null && recordings.length > 0;

  return (
    <AppShell>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">
            Library
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isDevAuthBypassEnabled() && (
            <Button
              size="lg"
              variant="outline"
              disabled={seeding}
              onClick={handleSeed}
              className="h-14 border-2 border-foreground px-6 text-lg font-bold"
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
            className="h-14 border-2 border-foreground bg-accent px-6 text-lg font-bold text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
          >
            <Link href="/studio">
              <CircleDot className="mr-2 h-5 w-5" />
              New Recording
            </Link>
          </Button>
        </div>
      </div>

      {hasRecordings && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recordings…"
              aria-label="Search recordings by title"
              className="h-12 border-2 border-foreground pl-10 pr-10 text-base font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as LibrarySort)}
          >
            <SelectTrigger
              aria-label="Sort recordings"
              className="h-12 w-[12rem] border-2 border-foreground text-base font-bold"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-2 border-foreground">
              {(Object.keys(SORT_LABELS) as LibrarySort[]).map((key) => (
                <SelectItem key={key} value={key} className="font-medium">
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={selectionMode ? "default" : "outline"}
            onClick={toggleSelectionMode}
            aria-pressed={selectionMode}
            className={`h-12 border-2 border-foreground px-5 text-base font-bold ${
              selectionMode ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            {selectionMode ? "Done" : "Select"}
          </Button>
        </div>
      )}

      {recordings === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-video animate-pulse border-2 border-foreground bg-muted"
            />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-foreground bg-card py-24 text-center">
          <img
            src={emptyBowlNacho}
            alt="A sad nacho mascot leaning on an empty bowl"
            className="mb-6 w-full max-w-[14rem] object-contain"
          />
          <h2 className="font-display text-3xl font-extrabold">
            No recordings yet
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Hit record, talk it out, and your video will show up right here.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 border-2 border-foreground bg-accent px-8 text-lg font-bold text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
          >
            <Link href="/studio">Start Recording</Link>
          </Button>
        </div>
      ) : visibleRecordings && visibleRecordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-foreground bg-card py-24 text-center">
          <h2 className="font-display text-3xl font-extrabold">
            No recordings found
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            No recordings match “{query.trim()}”. Try a different search.
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setQuery("")}
            className="mt-8 h-12 border-2 border-foreground px-6 text-base font-bold"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecordings?.map((rec) => (
            <RecordingCard
              key={rec.id}
              rec={rec}
              busy={busyId === rec.id}
              selectable={selectionMode}
              selected={selectedIds.has(rec.id)}
              onToggleSelected={toggleSelected}
              onTogglePin={handleTogglePin}
              onOpenEditor={(id) => navigate(`/editor/${id}`)}
              onView={(shareId) =>
                isDesktop
                  ? openExternalUrl(`${apiOrigin}/v/${shareId}`)
                  : navigate(`/v/${shareId}`)
              }
              onCopy={handleCopy}
              onGetLink={handleGetLink}
              onUnpublish={handleUnpublish}
              onDownload={handleDownload}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="border-2 border-foreground">
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
            <AlertDialogCancel className="border border-foreground font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="border border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectionMode && selectedCount > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3 border-2 border-foreground bg-card px-5 py-3 shadow-lg">
            <span className="font-bold">
              {selectedCount} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllVisible}
              className="border border-foreground font-bold"
            >
              Select all
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="border border-foreground font-bold"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="border border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !bulkDeleting && setBulkDeleteOpen(open)}
      >
        <AlertDialogContent className="border-2 border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {selectedCount === 1
                ? "Delete this recording?"
                : `Delete ${selectedCount} recordings?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the local copies from this device. Published share
              links will keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={bulkDeleting}
              className="border border-foreground font-bold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              className="border border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              {bulkDeleting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
