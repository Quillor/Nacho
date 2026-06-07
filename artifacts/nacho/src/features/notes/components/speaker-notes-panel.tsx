import { NotebookPen } from "lucide-react";
import { Label } from "@workspace/pico-ui/label";
import { MarkdownEditor } from "./markdown-editor";
import { useSpeakerNotes } from "../hooks/use-speaker-notes";

// Desktop-only speaker-notes authoring surface for the Studio. Markdown source
// with a live preview; appears in the presenter's content-protected overlay
// while recording (never in the recording itself), and is editable from there
// too.
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
        Only you see these in an on-screen overlay while recording. Type Markdown
        — <code>#</code> headings, <code>**bold**</code>, lists — and use the
        preview to check formatting.
      </p>
      <MarkdownEditor
        value={value}
        onChange={update}
        defaultMode="edit"
        className="border-2 border-foreground"
        placeholder={"# Intro\nWalk through the dashboard\n\n## Key points\n- ..."}
      />
    </div>
  );
}
