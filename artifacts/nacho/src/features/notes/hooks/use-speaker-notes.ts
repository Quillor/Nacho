import { useEffect, useRef, useState } from "react";
import { getNotes, saveNotes } from "@/lib/db";
import { desktopBridge } from "@/lib/desktop";

/**
 * Shared speaker-notes state (Markdown source) used by both the Studio authoring
 * panel and the on-screen notes overlay. Edits in either window:
 *   - update local state,
 *   - broadcast live to the other window via the bridge (setNotes), and
 *   - persist to IndexedDB (debounced).
 * Incoming broadcasts that differ from the local value are applied, so editing
 * the overlay updates the Studio panel and vice-versa. The echo of our own
 * broadcast is ignored (it equals the latest value).
 */
export function useSpeakerNotes() {
  const [value, setValue] = useState("");
  const latest = useRef("");
  const saveTimer = useRef<number>(0);

  useEffect(() => {
    let active = true;
    void getNotes().then((saved) => {
      if (!active) return;
      latest.current = saved;
      setValue(saved);
    });
    const off = desktopBridge?.onNotes((incoming) => {
      if (incoming === latest.current) return; // our own echo
      latest.current = incoming;
      setValue(incoming);
    });
    return () => {
      active = false;
      off?.();
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const update = (next: string) => {
    latest.current = next;
    setValue(next);
    desktopBridge?.setNotes(next); // live sync to the other window
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void saveNotes(next), 300);
  };

  return { value, update };
}
