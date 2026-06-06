import { Link } from "wouter";
import { Scissors, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { VideoPlayer } from "@/features/sharing";
import { formatTimestamp } from "@workspace/shared";
import { useRecordingEditor } from "../hooks/use-recording-editor";
import { TrimBar } from "./trim-bar";
import { EditorTabs } from "./editor-tabs";
import { PublishPanel } from "./publish-panel";

export function Editor() {
  const e = useRecordingEditor();

  if (e.notFound) {
    return (
      <AppShell>
        <div className="py-24 text-center">
          <h1 className="font-display text-4xl font-extrabold">
            Recording not found
          </h1>
          <Button
            asChild
            className="mt-6 border border-foreground bg-accent font-bold text-accent-foreground"
          >
            <Link href="/library">Back to Library</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!e.rec || !e.objectUrl) {
    return (
      <AppShell>
        <div className="aspect-video w-full animate-pulse border-2 border-foreground bg-muted" />
      </AppShell>
    );
  }

  const rec = e.rec;

  return (
    <AppShell>
      <Button
        variant="ghost"
        onClick={() => e.navigate("/library")}
        className="mb-4 font-bold text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Library
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <VideoPlayer
            ref={e.playerRef}
            src={e.objectUrl}
            chapters={e.chapters}
            showChapterTitles={e.displayChaptersOnVideo}
            selfieCorner={rec.selfieCorner}
            transcript={rec.transcript}
            startTime={e.trimStart}
            endTime={e.trimEnd || undefined}
            durationSec={rec.durationSec}
            onTimeUpdate={e.setCurrent}
            onDurationChange={(d) => {
              e.setDuration(d);
              if (!e.trimEnd) e.setTrimEnd(d);
            }}
          />

          <div className="mt-6 border-2 border-foreground bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              <h3 className="font-display text-lg font-bold">
                Trim · {formatTimestamp(e.trimmedDuration)}
              </h3>
            </div>
            <TrimBar
              duration={e.duration}
              start={e.trimStart}
              end={e.trimEnd}
              current={e.current}
              filmstrip={e.filmstrip}
              onStart={(v) => {
                e.setTrimStart(v);
                e.seek(v);
              }}
              onEnd={(v) => {
                e.setTrimEnd(v);
                e.seek(v);
              }}
              onScrub={e.seek}
            />
            <div className="mt-2 flex justify-between font-mono text-xs font-bold text-muted-foreground">
              <span>{formatTimestamp(e.trimStart)}</span>
              <span>{formatTimestamp(e.trimEnd)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block font-display text-sm font-bold uppercase">
              Title
            </Label>
            <Input
              value={e.title}
              onChange={(ev) => e.setTitle(ev.target.value)}
              className="border-2 border-foreground font-bold"
            />
          </div>

          <EditorTabs
            description={e.description}
            onDescriptionChange={e.setDescription}
            chapters={e.chapters}
            onAddChapter={e.addChapter}
            onUpdateChapter={e.updateChapter}
            onRemoveChapter={e.removeChapter}
            displayChaptersOnVideo={e.displayChaptersOnVideo}
            onDisplayChaptersOnVideoChange={e.setDisplayChaptersOnVideo}
            current={e.current}
            onSeek={e.seek}
            transcript={rec.transcript}
            notifyOnView={e.notifyOnView}
            onNotifyOnViewChange={e.handleNotifyOnViewChange}
          />

          <PublishPanel
            isPublic={e.isPublic}
            shareId={e.shareId}
            copied={e.copied}
            busy={e.busy}
            publishStep={e.publishStep}
            upload={e.upload}
            onCopyLink={e.copyLink}
            onOpenPublic={() => e.navigate(`/v/${e.shareId}`)}
            onUnpublish={e.handleUnpublish}
            onGetLink={e.handleGetLink}
            onRetryUpload={e.retry}
            onSave={e.handleSave}
          />
        </div>
      </div>
    </AppShell>
  );
}
