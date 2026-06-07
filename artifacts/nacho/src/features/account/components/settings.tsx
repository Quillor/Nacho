import { useEffect, useState } from "react";
import {
  Info,
  HardDrive,
  Trash2,
  Tag,
  UserX,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@workspace/pico-ui/button";
import { Skeleton } from "@workspace/pico-ui/skeleton";
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
import { AccountManagement } from "./account-management";
import { cardClass, getDisplayName, headingClass } from "../account";
import { useGetVersion } from "@workspace/api-client-react";
import { isDesktop } from "@/lib/desktop";
import { listRecordings, deleteRecording } from "@/lib/db";
import { formatBytes } from "@workspace/shared";
import type { LocalRecordingMeta } from "@/lib/types";

/** Right-aligned loading bar that mirrors the bold value it replaces. */
function ValueSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`h-5 ${className ?? "w-16"}`} />;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SettingsPage() {
  const { toast } = useToast();
  const { data: version } = useGetVersion();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const [recordings, setRecordings] = useState<LocalRecordingMeta[]>([]);
  const [recordingsLoaded, setRecordingsLoaded] = useState(false);
  const [usage, setUsage] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await user.delete();
      setConfirmDelete(false);
      toast({ title: "Account deleted" });
      await signOut({ redirectUrl: basePath || "/" });
    } catch (err) {
      setDeleting(false);
      toast({
        title: "Couldn't delete account",
        description:
          err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const accountEmail = user?.primaryEmailAddress?.emailAddress;
  const accountName =
    getDisplayName(user?.unsafeMetadata) ||
    user?.fullName ||
    user?.firstName ||
    accountEmail;

  const publishedCount = recordings.filter((r) => r.shareId).length;

  return (
    <AppShell>
 <h1 className="mb-2 font-display text-5xl font-extrabold tracking-tight">
        Settings
      </h1>
      <p className="mb-10 text-lg font-medium text-muted-foreground">
        Manage your account, videos, and see what's running.
      </p>

      <div className="mb-6">
        <AccountManagement />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={cardClass}>
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
              <dt className="font-medium text-muted-foreground">
                Disk used
              </dt>
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
        </div>

        <div className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            <h2 className={headingClass}>About</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex items-center justify-between border-b border-dashed border-foreground pb-2">
              <dt className="flex items-center gap-1 font-medium text-muted-foreground">
                <Tag className="h-4 w-4" /> Version
              </dt>
              <dd className="font-mono font-bold">
                {version ? (
                  version.version
                ) : isDesktop ? (
                  "Desktop"
                ) : (
                  <ValueSkeleton className="w-16" />
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-muted-foreground">Released</dt>
              <dd className="font-mono font-bold">
                {version ? (
                  version.releaseDate
                ) : isDesktop ? (
                  "local build"
                ) : (
                  <ValueSkeleton className="w-24" />
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Nacho records in your browser. Recordings stay on this device until
            you publish — publishing uploads a copy so anyone with the link can
            watch.
          </p>
        </div>
      </div>

      <div className="mt-6 border-2 border-destructive bg-destructive/5 p-6 shadow-[6px_6px_0_0_hsl(var(--destructive))]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className={`${headingClass} text-destructive`}>Danger zone</h2>
          <Badge variant="destructive" className="ml-auto">
            Permanent
          </Badge>
        </div>
        <dl className="space-y-3">
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-destructive/40 pb-2">
            <dt className="flex items-center gap-1 font-medium text-muted-foreground">
              <Mail className="h-4 w-4" /> Signed in as
            </dt>
            <dd className="truncate font-bold" title={accountEmail ?? ""}>
              {userLoaded ? (
                (accountName ?? "—")
              ) : (
                <ValueSkeleton className="w-32" />
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Permanently delete your Nacho account. This cannot be undone. Your
          locally stored recordings stay on this device, and published share
          links keep working.
        </p>
        <Button
          variant="destructive"
          disabled={!user || deleting}
          onClick={() => setConfirmDelete(true)}
          className="mt-6 w-full border-2 border-destructive bg-destructive font-bold text-destructive-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] transition-all hover:bg-destructive/90 hover:translate-y-[2px] hover:shadow-none"
        >
          <UserX className="mr-2 h-4 w-4" /> Delete my account
        </Button>
      </div>

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

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-2 border-destructive">
          <AlertDialogHeader>
 <AlertDialogTitle className="font-display">
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your Nacho account
              {accountEmail ? ` (${accountEmail})` : ""}. This cannot be undone.
              Recordings stored on this device are not removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border border-foreground font-bold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteAccount();
              }}
              disabled={deleting}
              className="border border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
