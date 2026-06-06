import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LocalRecording, LocalRecordingMeta } from "./types";

interface NachoDB extends DBSchema {
  recordings: {
    key: string;
    value: LocalRecording;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "nacho";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NachoDB>> | null = null;

function getDB(): Promise<IDBPDatabase<NachoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NachoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("recordings", { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
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
