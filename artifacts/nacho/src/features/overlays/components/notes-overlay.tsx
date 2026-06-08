import { RichTextEditor } from "@/features/editor/components/rich-text-editor";
import { useSpeakerNotes } from "@/features/notes";
import { OverlayShell, DRAG_REGION } from "./overlay-shell";

// Presenter-only speaker notes (content-protected). Inline WYSIWYG, editable on
// the overlay — edits sync live back to the Studio panel and persist.
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
        <RichTextEditor
          variant="notes"
          fill
          className="min-h-0 flex-1 border-0"
          value={value}
          onChange={update}
          placeholder="Write your talking points…"
        />
      </div>
    </OverlayShell>
  );
}
