import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LocalRecording, LocalRecordingMeta } from "./types";

interface NotesDoc {
  id: string;
  html: string;
  updatedAt: number;
}

/**
 * One captured MediaRecorder chunk, persisted incrementally during recording
 * so a long take doesn't have to live entirely in memory before it's saved.
 */
interface CaptureChunk {
  /** `${captureId}:${seq padded}` — keeps chunks grouped and ordered. */
  key: string;
  captureId: string;
  seq: number;
  data: Blob;
}

interface NachoDB extends DBSchema {
  recordings: {
    key: string;
    value: LocalRecording;
    indexes: { "by-createdAt": number };
  };
  notes: {
    key: string;
    value: NotesDoc;
  };
  chunks: {
    key: string;
    value: CaptureChunk;
    indexes: { "by-capture": string };
  };
}

const DB_NAME = "nacho";
const DB_VERSION = 3;

/** Single speaker-notes document (desktop-only authoring). */
const NOTES_KEY = "default";

let dbPromise: Promise<IDBPDatabase<NachoDB>> | null = null;

function getDB(): Promise<IDBPDatabase<NachoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NachoDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore("recordings", { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
        if (oldVersion < 2) {
          db.createObjectStore("notes", { keyPath: "id" });
        }
        if (oldVersion < 3) {
          const chunkStore = db.createObjectStore("chunks", { keyPath: "key" });
          chunkStore.createIndex("by-capture", "captureId");
        }
      },
    });
  }
  return dbPromise;
}

// Records saved before newer fields existed get safe defaults on read.
function normalize<T extends Partial<LocalRecording>>(rec: T): T {
  let out = rec;
  if (!out.visibility) out = { ...out, visibility: "private" };
  if (out.displayChaptersOnVideo === undefined) {
    out = { ...out, displayChaptersOnVideo: false };
  }
  if (out.notifyOnView === undefined) {
    out = { ...out, notifyOnView: false };
  }
  if (out.pinned === undefined) {
    out = { ...out, pinned: false };
  }
  if (out.selfieCorner === undefined) {
    out = { ...out, selfieCorner: null };
  }
  return out;
}

function stripBlobs(rec: LocalRecording): LocalRecordingMeta {
  const { blob: _blob, ...meta } = normalize(rec);
  return meta;
}

export async function saveRecording(rec: LocalRecording): Promise<void> {
  const db = await getDB();
  await db.put("recordings", rec);
}

export async function getRecording(
  id: string,
): Promise<LocalRecording | undefined> {
  const db = await getDB();
  const rec = await db.get("recordings", id);
  return rec ? normalize(rec) : undefined;
}

export async function listRecordings(): Promise<LocalRecordingMeta[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("recordings", "by-createdAt");
  return all.reverse().map(stripBlobs);
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("recordings", id);
}

export async function updateRecording(
  id: string,
  patch: Partial<LocalRecording>,
): Promise<LocalRecording | undefined> {
  const db = await getDB();
  const existing = await db.get("recordings", id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  await db.put("recordings", updated);
  return updated;
}

/** Load the speaker-notes HTML (empty string if none saved yet). */
export async function getNotes(): Promise<string> {
  const db = await getDB();
  const doc = await db.get("notes", NOTES_KEY);
  return doc?.html ?? "";
}

/** Persist the speaker-notes HTML (single document, desktop-authored). */
export async function saveNotes(html: string): Promise<void> {
  const db = await getDB();
  await db.put("notes", { id: NOTES_KEY, html, updatedAt: Date.now() });
}

// --- Capture chunks (incremental recording persistence) ---

function chunkKey(captureId: string, seq: number): string {
  // Zero-pad so string ordering matches numeric ordering within a capture.
  return `${captureId}:${String(seq).padStart(8, "0")}`;
}

/** Persist one MediaRecorder chunk for an in-progress capture. */
export async function putCaptureChunk(
  captureId: string,
  seq: number,
  data: Blob,
): Promise<void> {
  const db = await getDB();
  await db.put("chunks", { key: chunkKey(captureId, seq), captureId, seq, data });
}

/** Read back a capture's chunks in order (to assemble the final blob). */
export async function getCaptureChunks(captureId: string): Promise<Blob[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex("chunks", "by-capture", captureId);
  rows.sort((a, b) => a.seq - b.seq);
  return rows.map((r) => r.data);
}

/** Drop a capture's chunks (after assembly, or when a capture is cancelled). */
export async function deleteCaptureChunks(captureId: string): Promise<void> {
  const db = await getDB();
  const keys = await db.getAllKeysFromIndex("chunks", "by-capture", captureId);
  const tx = db.transaction("chunks", "readwrite");
  await Promise.all(keys.map((k) => tx.store.delete(k)));
  await tx.done;
}

/**
 * Drop every persisted capture chunk. Called once at app boot: any chunks
 * still present belong to a session that crashed or was closed mid-recording,
 * and nothing can reassemble them into a recording anymore.
 */
export async function clearAllCaptureChunks(): Promise<void> {
  const db = await getDB();
  await db.clear("chunks");
}
