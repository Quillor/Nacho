import { Link } from "wouter";
import { CircleDot, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import emptyBowlNacho from "@workspace/nacho-illustrations/assets/sad-nacho-empty-bowl.png";
import { Button } from "@workspace/pico-ui/button";
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
import { useLibrary } from "../hooks/use-library";
import { RecordingCard } from "./recording-card";

/** The Library: a grid of locally-stored recordings with publish/pin/delete. */
export function LibraryPage() {
  const {
    recordings,
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
  } = useLibrary();

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
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((rec) => (
            <RecordingCard
              key={rec.id}
              rec={rec}
              busy={busyId === rec.id}
              onTogglePin={handleTogglePin}
              onOpenEditor={(id) => navigate(`/editor/${id}`)}
              onView={(shareId) => navigate(`/v/${shareId}`)}
              onCopy={handleCopy}
              onGetLink={handleGetLink}
              onUnpublish={handleUnpublish}
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
    </AppShell>
  );
}
