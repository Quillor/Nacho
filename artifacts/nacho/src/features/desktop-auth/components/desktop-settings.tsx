import { useEffect, useState } from "react";
import { HardDrive, Trash2, Mail, LogOut, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@workspace/pico-ui/button";
import { formatBytes } from "@workspace/shared";
import { listRecordings, deleteRecording } from "@/lib/db";
import type { LocalRecordingMeta } from "@/lib/types";
import { checkForUpdates } from "@/lib/update-check";
import { useDesktopAuth } from "../desktop-auth";

const card = "border-2 border-foreground bg-card p-6";
const heading = "font-display text-xl font-bold";

// Desktop settings: account + local storage. No Clerk-managed profile editing
// (that lives on the web); account actions here are limited to sign-out.
export function DesktopSettings() {
  const { user, signOut } = useDesktopAuth();
  const [recordings, setRecordings] = useState<LocalRecordingMeta[]>([]);
  const [usage, setUsage] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const onCheckUpdates = async () => {
    setChecking(true);
    setUpdateMsg(null);
    try {
      const result = await checkForUpdates();
      if (result.status === "update-available") {
        setUpdateMsg(
          `Update available (v${result.latest}). Opening the download page…`,
        );
      } else if (result.status === "up-to-date") {
        setUpdateMsg(`You're on the latest version (v${result.current}).`);
      } else {
        setUpdateMsg("Couldn't determine the latest version. Try again later.");
      }
    } catch {
      setUpdateMsg("Update check failed. Try again later.");
    } finally {
      setChecking(false);
    }
  };

  const refresh = () => {
    void listRecordings().then((recs) => {
      setRecordings(recs);
      setLoaded(true);
    });
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then((e) => setUsage(e.usage ?? 0));
    } else {
      setUsage(0);
    }
  };

  useEffect(refresh, []);

  const clearAll = async () => {
    await Promise.all(recordings.map((r) => deleteRecording(r.id)));
    refresh();
  };

  return (
    <AppShell>
      <h1 className="mb-2 font-display text-5xl font-extrabold tracking-tight">
        Settings
      </h1>
      <p className="mb-10 text-lg font-medium text-muted-foreground">
        Your account and on-device storage.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={card}>
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <h2 className={heading}>Account</h2>
          </div>
          <p className="font-bold">{user?.name || user?.email || "Signed in"}</p>
          {user?.email && (
            <p className="text-sm font-medium text-muted-foreground">
              {user.email}
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => void onCheckUpdates()}
            disabled={checking}
            className="mt-6 w-full border-2 border-foreground font-bold"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4${checking ? " animate-spin" : ""}`}
            />
            {checking ? "Checking…" : "Check for updates"}
          </Button>
          {updateMsg && (
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {updateMsg}
            </p>
          )}
          <Button
            variant="outline"
            onClick={signOut}
            className="mt-4 w-full border-2 border-foreground font-bold"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>

        <div className={card}>
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <h2 className={heading}>On this device</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex items-center justify-between border-b border-dashed border-foreground pb-2">
              <dt className="font-medium text-muted-foreground">Recordings</dt>
              <dd className="font-bold">{loaded ? recordings.length : "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-muted-foreground">Disk used</dt>
              <dd className="font-bold">
                {usage === null ? "—" : formatBytes(usage)}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            disabled={!loaded || recordings.length === 0}
            onClick={() => void clearAll()}
            className="mt-6 w-full border-2 border-foreground font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear local recordings
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
