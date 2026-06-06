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
  Save,
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
  dirty,
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
  dirty: boolean;
  publishStep: string;
  upload: UploadState;
  onCopyLink: () => void;
  onOpenPublic: () => void;
  onUnpublish: () => void;
  onGetLink: () => void;
  onRetryUpload: () => void;
  onSave: () => void;
}) {
  const uploadFailed = upload.phase === "failed";
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
                <>
                  <Check className="mr-2 h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </>
              )}
            </Button>
          </div>
          {copied && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 text-sm font-bold"
            >
              <Check className="h-4 w-4" /> Link copied to your clipboard.
            </p>
          )}
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
          {uploadFailed ? (
            // Failed upload: a single, unambiguous recovery action. The video
            // must finish saving to the cloud before a public link is possible,
            // so we hide "Get public link" and only offer the retry here.
            <div className="space-y-2 border-2 border-foreground bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" />
                Couldn't save to the cloud.
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Your recording is still safe on this device. Retry the save —
                you can share a public link once it finishes.
              </p>
              <Button
                onClick={onRetryUpload}
                disabled={busy}
                size="lg"
                className="h-14 w-full border-2 border-foreground bg-accent text-lg font-black text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
              >
                <RotateCcw className="mr-2 h-5 w-5" /> Retry save
              </Button>
            </div>
          ) : (
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
          )}
        </div>
      )}
      {dirty ? (
        <Button
          onClick={onSave}
          disabled={busy}
          className="w-full border-2 border-foreground bg-accent font-black text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm"
        >
          <Save className="mr-2 h-4 w-4" /> Save changes
        </Button>
      ) : (
        <Button
          disabled
          variant="outline"
          className="w-full border-2 border-foreground font-bold"
        >
          <Check className="mr-2 h-4 w-4" /> All changes saved
        </Button>
      )}
    </div>
  );
}
