import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { Textarea } from "@workspace/pico-ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/pico-ui/card";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { Upload } from "lucide-react";
import { formatBytes, formatDateTime } from "@workspace/shared";
import { useDesktopReleaseEditor } from "../hooks/use-desktop-release-editor";

export function DesktopReleaseSection() {
  const {
    release,
    isLoading,
    version,
    setVersion,
    notes,
    setNotes,
    file,
    setFile,
    uploadProgress,
    canSave,
    isSaving,
    hasExisting,
    save,
  } = useDesktopReleaseEditor();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const progressPct =
    uploadProgress !== null ? Math.round(uploadProgress * 100) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desktop App (macOS)</CardTitle>
        <CardDescription>
          The latest Mac build served at the public download page and used by the
          desktop app's update check.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {hasExisting && release ? (
          <div className="text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">v{release.version}</span>
            {release.fileSize ? ` · ${formatBytes(release.fileSize)}` : ""}
            {release.updatedAt ? ` · updated ${formatDateTime(release.updatedAt)}` : ""}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No desktop release published yet.
          </div>
        )}

        <div className="grid gap-2 max-w-xs">
          <Label htmlFor="release-version">Version</Label>
          <Input
            id="release-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="release-notes">Release notes</Label>
          <Textarea
            id="release-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's new in this version..."
            className="min-h-[100px] text-sm"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="release-file">Mac build (.dmg)</Label>
          <Input
            id="release-file"
            type="file"
            accept=".dmg,application/x-apple-diskimage"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
          {progressPct !== null && (
            <p className="text-xs text-muted-foreground">
              Uploading… {progressPct}%
            </p>
          )}
        </div>

        <Button onClick={save} disabled={!canSave || isSaving}>
          <Upload className="mr-2 h-4 w-4" />
          {isSaving ? "Publishing…" : "Publish release"}
        </Button>
      </CardContent>
    </Card>
  );
}
