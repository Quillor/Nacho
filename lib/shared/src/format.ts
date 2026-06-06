// Formatting helpers shared across the Nacho apps. One home so the same helper
// isn't re-implemented (and drifted) per app.

import { format, parseISO } from "date-fns";

// --- Duration / media helpers ---

/** Compact `m:ss` clock for a duration in seconds (e.g. `3:07`). */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** `m:ss` (or `h:mm:ss` past an hour) timestamp for a position in seconds. */
export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Human "x ago" relative date, falling back to a locale date past 30 days. */
export function formatRelativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 30) return new Date(timestamp).toLocaleDateString();
  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return "just now";
}

/** Byte count as `B` / `KB` / `MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Date / number helpers (ISO date strings, e.g. API timestamps) ---

/** `MMM d, yyyy` from an ISO date string; "Never" when empty. */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

/** `MMM d, yyyy h:mm a` from an ISO date string; "Never" when empty. */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  try {
    return format(parseISO(dateString), "MMM d, yyyy h:mm a");
  } catch {
    return dateString;
  }
}

/** Thousands-separated integer; "0" when null/undefined. */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}
