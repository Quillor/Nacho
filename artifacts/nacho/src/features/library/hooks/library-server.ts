// Server-side library sync: fetches the signed-in user's recordings from the
// backend and merges them with the device-local list, so recordings made on
// other devices — or whose local copy was cleared — still show up in the grid.

import { storageUrl } from "@/lib/api";
import { apiPath, authHeaders, cloudEnabled } from "@/lib/desktop-api";
import type { LibraryItem, LocalRecordingMeta, Visibility } from "@/lib/types";

/** Shape of one row from GET /api/recordings (the server-side library). */
export interface ServerRecordingSummary {
  shareId: string;
  status: "pending" | "ready";
  title: string;
  description: string;
  visibility: Visibility;
  durationSec: number;
  trimStart: number;
  trimEnd: number;
  hasAudio: boolean;
  thumbnailPath?: string | null;
  gifPath?: string | null;
  selfieCorner?: LibraryItem["selfieCorner"];
  views: number;
  createdAt: string;
}

/** Fetch the signed-in user's server-side recordings; [] when unavailable. */
export async function fetchServerRecordings(): Promise<
  ServerRecordingSummary[]
> {
  if (!cloudEnabled) return [];
  try {
    const res = await fetch(apiPath("/api/recordings"), {
      credentials: "include",
      headers: { ...(await authHeaders()) },
    });
    if (!res.ok) return [];
    return (await res.json()) as ServerRecordingSummary[];
  } catch {
    return []; // offline / older server — the local list still works
  }
}

/** Map a server-only recording into a Library grid item. */
function toLibraryItem(r: ServerRecordingSummary): LibraryItem {
  return {
    id: `remote-${r.shareId}`,
    remote: true,
    remoteStatus: r.status,
    thumbnailUrl: r.thumbnailPath ? storageUrl(r.thumbnailPath) : null,
    title: r.title,
    description: r.description,
    durationSec: r.durationSec,
    trimStart: r.trimStart,
    trimEnd: r.trimEnd,
    hasAudio: r.hasAudio,
    source: "screen",
    selfieCorner: r.selfieCorner ?? null,
    captionLang: null,
    chapters: [],
    displayChaptersOnVideo: false,
    notifyOnView: false,
    pinned: false,
    transcript: [],
    createdAt: Date.parse(r.createdAt) || 0,
    thumbnail: null,
    mimeType: "video/webm",
    visibility: r.visibility,
    shareId: r.shareId,
    videoPath: null,
    thumbnailPath: r.thumbnailPath ?? null,
    gifPath: r.gifPath ?? null,
  };
}

/**
 * Merge the device-local list with the server-side library. Local recordings
 * win (they're richer — editable, pinned, thumbnail blob); server recordings
 * not present locally appear as cloud-only entries so nothing the user owns
 * is ever invisible just because this device's storage was cleared.
 */
export function mergeLibraries(
  local: LocalRecordingMeta[],
  server: ServerRecordingSummary[],
): LibraryItem[] {
  const localShareIds = new Set(
    local.map((r) => r.shareId).filter((s): s is string => Boolean(s)),
  );
  const remoteOnly = server
    .filter((r) => !localShareIds.has(r.shareId))
    .map(toLibraryItem);
  return [...local, ...remoteOnly];
}
