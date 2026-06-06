import {
  Globe,
  Lock,
  Loader2,
  Check,
  Copy,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import { shareUrl } from "@/lib/api";
import type { UploadState } from "@/features/publishing";

// The share/visibility panel at the bottom of the editor: shows the public link
// + unpublish controls when public, or the background-upload status + "Get
// public link" action when private. Ends with the always-present save button.
export function PublishPanel({
  isPublic,
  shareId,
  copied,
  busy,
  publishStep,
  upload,
  onCopyLink,
  onOpenPublic,
  onUnpublish,
  onGetLink,
  onRetryUpload,
  onSave,
}: {
  isPublic: boolean;
  shareId: string | null;
  copied: boolean;
  busy: boolean;
  publishStep: string;
  upload: UploadState;
  onCopyLink: () => void;
  onOpenPublic: () => void;
  onUnpublish: () => void;
  onGetLink: () => void;
  onRetryUpload: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3 border-t-2 border-foreground pt-6">
      {isPublic ? (
        <div className="space-y-3 border-2 border-foreground bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-2 font-display font-bold">
            <Globe className="h-5 w-5" /> Public
          </div>
          <p className="text-sm font-medium">
            Anyone with the link can watch this recording.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareUrl(shareId!)}
              className="h-10 border border-foreground bg-background font-mono text-xs"
            />
            <Button
              onClick={onCopyLink}
              className="h-10 shrink-0 border border-foreground bg-accent font-bold text-accent-foreground"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={onOpenPublic}
            variant="outline"
            className="w-full border border-foreground bg-background font-bold"
          >
            Open public page
          </Button>
          <Button
            onClick={onUnpublish}
            disabled={busy}
            variant="ghost"
            className="w-full font-bold"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Make private
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 border-2 border-foreground bg-card p-4">
          <div className="flex items-center gap-2 font-display font-bold">
            <Lock className="h-5 w-5" /> Private
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Only you can see this. Generate a link to share it.
          </p>
          {upload.phase === "uploading" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <UploadCloud className="h-4 w-4 animate-pulse" />
                Saving to cloud… {Math.round(upload.progress * 100)}%
              </div>
              <div className="h-3 w-full border border-foreground bg-background">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.round(upload.progress * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {upload.phase === "uploaded" && (
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4" />
              Saved — sharing will be instant.
            </div>
          )}
          {upload.phase === "failed" && (
            <div className="space-y-2 border border-foreground bg-background p-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" />
                Upload failed.
              </div>
              <Button
                onClick={onRetryUpload}
                variant="outline"
                size="sm"
                className="border border-foreground font-bold"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Retry upload
              </Button>
            </div>
          )}
          <Button
            onClick={onGetLink}
            disabled={busy}
            size="lg"
            className="h-14 w-full border-2 border-foreground bg-accent text-lg font-black text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {publishStep || "Working…"}
              </>
            ) : (
              <>
                <Globe className="mr-2 h-5 w-5" /> Get public link
              </>
            )}
          </Button>
        </div>
      )}
      <Button
        onClick={onSave}
        variant="outline"
        className="w-full border-2 border-foreground font-bold"
      >
        Save changes
      </Button>
    </div>
  );
}
