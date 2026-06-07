import { Plus, Trash2, Captions, Bell } from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import { Switch } from "@workspace/pico-ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/pico-ui/tabs";
import { formatTimestamp } from "@workspace/shared";
import { CHAPTER_LABEL_MAX_CHARS } from "@/features/sharing";
import type { Chapter, TranscriptSegment } from "@/lib/types";
import { RichTextEditor } from "./rich-text-editor";

// The editor's tabbed metadata panel: description, chapters, transcript review,
// and per-recording settings. Pure presentation — all state lives in the parent.
export function EditorTabs({
  description,
  onDescriptionChange,
  chapters,
  onAddChapter,
  onUpdateChapter,
  onRemoveChapter,
  displayChaptersOnVideo,
  onDisplayChaptersOnVideoChange,
  current,
  onSeek,
  transcript,
  notifyOnView,
  onNotifyOnViewChange,
}: {
  description: string;
  onDescriptionChange: (v: string) => void;
  chapters: Chapter[];
  onAddChapter: () => void;
  onUpdateChapter: (index: number, label: string) => void;
  onRemoveChapter: (index: number) => void;
  displayChaptersOnVideo: boolean;
  onDisplayChaptersOnVideoChange: (v: boolean) => void;
  current: number;
  onSeek: (t: number) => void;
  transcript: TranscriptSegment[];
  notifyOnView: boolean;
  onNotifyOnViewChange: (v: boolean) => void;
}) {
  return (
    <Tabs defaultValue="description">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="chapters">Chapters</TabsTrigger>
        <TabsTrigger value="transcript">Transcript</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-4">
        <RichTextEditor
          value={description}
          onChange={onDescriptionChange}
          placeholder="Add context, links, or next steps…"
        />
      </TabsContent>

      <TabsContent value="chapters" className="mt-4 space-y-3">
        <label className="flex items-center justify-between gap-3 border border-foreground bg-muted p-3">
          <span className="text-sm font-bold">Display chapter on video</span>
          <Switch
            variant="borderless"
            checked={displayChaptersOnVideo}
            onCheckedChange={onDisplayChaptersOnVideoChange}
            aria-label="Display chapter on video"
          />
        </label>
        <Button
          onClick={onAddChapter}
          variant="outline"
          className="w-full border-2 border-foreground font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Add chapter at{" "}
          {formatTimestamp(current)}
        </Button>
        {chapters.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No chapters yet.
          </p>
        ) : (
          <div className="divide-y divide-foreground border border-foreground">
            {chapters.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-card p-2"
              >
                <button
                  type="button"
                  onClick={() => onSeek(c.time)}
                  className="shrink-0 border border-foreground bg-accent px-2 py-1 font-mono text-xs font-bold text-accent-foreground"
                >
                  {formatTimestamp(c.time)}
                </button>
                <Input
                  value={c.label}
                  onChange={(e) => onUpdateChapter(i, e.target.value)}
                  maxLength={CHAPTER_LABEL_MAX_CHARS}
                  className="h-9 border border-foreground font-medium"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveChapter(i)}
                  className="shrink-0 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="transcript" className="mt-4">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <Captions className="mb-3 h-8 w-8" />
            <p className="text-sm">
              No transcript. Enable live captions when recording.
            </p>
          </div>
        ) : (
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {transcript.map((seg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSeek(seg.start)}
                className="flex w-full gap-3 border border-transparent p-2 text-left transition-colors hover:border-foreground hover:bg-muted"
              >
                <span className="shrink-0 font-mono text-xs font-bold text-foreground">
                  {formatTimestamp(seg.start)}
                </span>
                <span className="text-sm">{seg.text}</span>
              </button>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="settings" className="mt-4 space-y-3">
        <label className="flex items-start justify-between gap-3 border border-foreground bg-muted p-3">
          <span className="space-y-1">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Bell className="h-4 w-4" /> Notify me when viewed
            </span>
            <span className="block text-xs font-medium text-muted-foreground">
              Get an email each time someone opens the share link and presses
              play.
            </span>
          </span>
          <Switch
            variant="borderless"
            checked={notifyOnView}
            onCheckedChange={onNotifyOnViewChange}
            aria-label="Notify me when viewed"
          />
        </label>
      </TabsContent>
    </Tabs>
  );
}
