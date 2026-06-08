import { getDesktopRelease } from "@workspace/api-client-react";
import { desktopBridge, openExternalUrl } from "./desktop";
import { apiOrigin } from "./desktop-api";

export type UpdateCheckResult =
  | { status: "up-to-date"; current: string; latest: string }
  | { status: "update-available"; current: string; latest: string }
  | { status: "unknown"; current: string };

/**
 * Compare two dotted version strings (e.g. "1.2.0"). Returns 1 when `a` is
 * newer, -1 when older, 0 when equal. Non-numeric/missing segments are treated
 * as 0 so "1.0" and "1.0.0" compare equal.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/** The public download page URL (system browser target on desktop). */
function downloadPageUrl(): string {
  const origin =
    apiOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/download`;
}

/**
 * Compare the running desktop app version against the latest published release.
 * When a newer release exists, opens the public download page in the system
 * browser. Returns the comparison outcome for the UI to surface.
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const current = (await desktopBridge?.getAppVersion()) ?? "";
  const release = await getDesktopRelease();
  const latest = release.version;

  if (!latest || !current) {
    return { status: "unknown", current };
  }

  if (compareVersions(latest, current) > 0) {
    openExternalUrl(downloadPageUrl());
    return { status: "update-available", current, latest };
  }

  return { status: "up-to-date", current, latest };
}
