import { NotebookPen } from "lucide-react";
import { Label } from "@workspace/pico-ui/label";
import { RichTextEditor } from "@/features/editor/components/rich-text-editor";
import { useSpeakerNotes } from "../hooks/use-speaker-notes";

// Desktop-only speaker-notes authoring for the Studio. Inline WYSIWYG (headings
// + body) — appears in the presenter's content-protected overlay while recording
// (never in the recording itself), and is editable from there too.
export function SpeakerNotesPanel() {
  const { value, update } = useSpeakerNotes();

  return (
    <div className="space-y-3 border-2 border-foreground bg-card p-5">
      <div className="flex items-center gap-3">
        <NotebookPen className="h-5 w-5" />
        <Label className="font-display text-sm font-bold uppercase tracking-wide">
          Speaker notes
        </Label>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Only you see these in an on-screen overlay while recording. Headings and
        body text.
      </p>
      <RichTextEditor
        variant="notes"
        value={value}
        onChange={update}
        placeholder="Jot down your talking points…"
      />
    </div>
  );
}
