import { useEffect, useState } from "react";
import { Info, HardDrive, Trash2, Tag, UserX, Mail } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AccountManagement,
  getDisplayName,
} from "@/components/account-management";
import { useGetVersion } from "@workspace/api-client-react";
import { listRecordings, deleteRecording } from "@/lib/db";
import { formatBytes } from "@/lib/format";
import type { LocalRecordingMeta } from "@/lib/types";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: version } = useGetVersion();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [recordings, setRecordings] = useState<LocalRecordingMeta[]>([]);
  const [usage, setUsage] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    listRecordings().then(setRecordings);
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => setUsage(est.usage ?? 0));
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
      <h1 className="mb-2 font-display text-5xl font-black uppercase tracking-tight">
        Settings
      </h1>
      <p className="mb-10 text-lg font-medium text-muted-foreground">
        Manage your account, local storage, and see what's running.
      </p>

      <div className="mb-6">
        <AccountManagement />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-4 border-foreground bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <h2 className="font-display text-xl font-black uppercase">
              Local Storage
            </h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between border-b-2 border-dashed border-foreground pb-2">
              <dt className="font-medium text-muted-foreground">Recordings</dt>
              <dd className="font-bold">{recordings.length}</dd>
            </div>
            <div className="flex justify-between border-b-2 border-dashed border-foreground pb-2">
              <dt className="font-medium text-muted-foreground">Published</dt>
              <dd className="font-bold">{publishedCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">
                Disk used
              </dt>
              <dd className="font-bold">
                {usage === null ? "—" : formatBytes(usage)}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            disabled={recordings.length === 0}
            onClick={() => setConfirmClear(true)}
            className="mt-6 w-full border-4 border-foreground font-bold uppercase text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear local recordings
          </Button>
        </div>

        <div className="border-4 border-foreground bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            <h2 className="font-display text-xl font-black uppercase">About</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between border-b-2 border-dashed border-foreground pb-2">
              <dt className="flex items-center gap-1 font-medium text-muted-foreground">
                <Tag className="h-4 w-4" /> Version
              </dt>
              <dd className="font-mono font-bold">
                {version?.version ?? "…"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-muted-foreground">Released</dt>
              <dd className="font-mono font-bold">
                {version?.releaseDate ?? "…"}
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

      <div className="mt-6 border-4 border-destructive bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserX className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-xl font-black uppercase text-destructive">
            Account
          </h2>
        </div>
        <dl className="space-y-3">
          <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-foreground pb-2">
            <dt className="flex items-center gap-1 font-medium text-muted-foreground">
              <Mail className="h-4 w-4" /> Signed in as
            </dt>
            <dd className="truncate font-bold" title={accountEmail ?? ""}>
              {accountName ?? "…"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Permanently delete your Nacho account. This cannot be undone. Your
          locally stored recordings stay on this device, and published share
          links keep working.
        </p>
        <Button
          variant="outline"
          disabled={!user || deleting}
          onClick={() => setConfirmDelete(true)}
          className="mt-6 w-full border-4 border-destructive font-bold uppercase text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <UserX className="mr-2 h-4 w-4" /> Delete my account
        </Button>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="border-4 border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase">
              Clear all local recordings?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every recording stored on this device. Published share
              links will keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-foreground font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAll}
              className="border-2 border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              Clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-4 border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase">
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
              className="border-2 border-foreground font-bold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteAccount();
              }}
              disabled={deleting}
              className="border-2 border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
