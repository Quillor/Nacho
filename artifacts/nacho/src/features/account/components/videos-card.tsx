import { useEffect, useState } from "react";
import { HardDrive, Trash2 } from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
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
import { listRecordings, deleteRecording } from "@/lib/db";
import { formatBytes } from "@workspace/shared";
import type { LocalRecordingMeta } from "@/lib/types";
import { cardClass, headingClass } from "../account";
import { ValueSkeleton } from "./settings-shared";

/** Local-recording storage stats plus a destructive "clear all" action. */
export function VideosCard() {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<LocalRecordingMeta[]>([]);
  const [recordingsLoaded, setRecordingsLoaded] = useState(false);
  const [usage, setUsage] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = () => {
    listRecordings().then((recs) => {
      setRecordings(recs);
      setRecordingsLoaded(true);
    });
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => setUsage(est.usage ?? 0));
    } else {
      setUsage(0);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const clearAll = async () => {
    await Promise.all(recordings.map((r) => deleteRecording(r.id)));
    setConfirmClear(false);
    refresh();
    toast({ title: "Local recordings cleared" });
  };

  const publishedCount = recordings.filter((r) => r.shareId).length;

  return (
    <Card className={cardClass}>
      <div className="mb-4 flex items-center gap-2">
        <HardDrive className="h-5 w-5" />
        <h2 className={headingClass}>Videos</h2>
      </div>
      <dl className="space-y-3">
        <div className="flex items-center justify-between border-b border-dashed border-foreground pb-2">
          <dt className="font-medium text-muted-foreground">Recordings</dt>
          <dd className="font-bold">
            {recordingsLoaded ? (
              recordings.length
            ) : (
              <ValueSkeleton className="w-8" />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between border-b border-dashed border-foreground pb-2">
          <dt className="font-medium text-muted-foreground">Published</dt>
          <dd className="font-bold">
            {recordingsLoaded ? (
              publishedCount
            ) : (
              <ValueSkeleton className="w-8" />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-medium text-muted-foreground">Disk used</dt>
          <dd className="font-bold">
            {usage === null ? (
              <ValueSkeleton className="w-16" />
            ) : (
              formatBytes(usage)
            )}
          </dd>
        </div>
      </dl>
      <Button
        variant="outline"
        disabled={!recordingsLoaded || recordings.length === 0}
        onClick={() => setConfirmClear(true)}
        className="mt-6 w-full border-2 border-foreground font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="mr-2 h-4 w-4" /> Clear local recordings
      </Button>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="border-2 border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Clear all local recordings?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every recording stored on this device. Published share
              links will keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-foreground font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAll}
              className="border border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              Clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
