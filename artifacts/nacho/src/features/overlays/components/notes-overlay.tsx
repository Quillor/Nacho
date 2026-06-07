import { MarkdownEditor, useSpeakerNotes } from "@/features/notes";
import { OverlayShell, DRAG_REGION } from "./overlay-shell";

// Presenter-only speaker notes (content-protected). Shows the formatted notes
// for presenting, and is fully editable on the overlay — edits sync live back to
// the Studio panel and persist. Defaults to Preview; switch to Edit/Split in the
// toolbar to make changes.
export function NotesOverlay() {
  const { value, update } = useSpeakerNotes();

  return (
    <OverlayShell className="p-3">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border-4 border-foreground bg-background shadow-md">
        <div
          style={DRAG_REGION}
          className="border-b-2 border-foreground bg-card px-4 py-2 font-display text-sm font-bold uppercase tracking-wide"
        >
          Speaker notes
        </div>
        <MarkdownEditor
          value={value}
          onChange={update}
          defaultMode="preview"
          placeholder="Write your talking points…"
          className="min-h-0 flex-1 border-0"
        />
      </div>
    </OverlayShell>
  );
}
