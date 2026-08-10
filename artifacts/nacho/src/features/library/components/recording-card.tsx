import { useEffect, useMemo } from "react";
import {
  Play,
  Trash2,
  Share2,
  Globe,
  Lock,
  Link2,
  Eye,
  Loader2,
  Pencil,
  UploadCloud,
  CheckCircle2,
  RotateCcw,
  Pin,
  MoreHorizontal,
  Download as DownloadIcon,
} from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { Badge } from "@workspace/pico-ui/badge";
import { Checkbox } from "@workspace/pico-ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/pico-ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/pico-ui/tooltip";
import { useUploadState, retryUpload } from "@/features/publishing";
import { formatDuration, formatRelativeDate } from "@workspace/shared";
import { cloudEnabled } from "@/lib/desktop-api";
import type { LibraryItem } from "@/lib/types";

/** Poster thumbnail for a recording; falls back to a play glyph when absent. */
function Thumb({ rec }: { rec: LibraryItem }) {
  const objectUrl = useMemo(
    () => (rec.thumbnail ? URL.createObjectURL(rec.thumbnail) : null),
    [rec.thumbnail],
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);
  // Cloud-only entries have no local thumbnail blob — use the server's.
  const url = objectUrl ?? rec.thumbnailUrl ?? null;

  return (
    <div className="relative aspect-video w-full overflow-hidden border-b-2 border-foreground bg-muted">
      {url ? (
        <img
          src={url}
          alt={rec.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Play className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <span className="absolute bottom-2 right-2 rounded-sm border border-foreground bg-background px-2 py-0.5 font-mono text-xs font-bold">
        {formatDuration(rec.trimEnd - rec.trimStart)}
      </span>
    </div>
  );
}

/** Background-upload status for one library card (subscribes to the manager). */
function UploadStatus({ id }: { id: string }) {
  const upload = useUploadState(id);
  if (upload.phase === "uploading") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <UploadCloud className="h-3.5 w-3.5 animate-pulse" />
        Saving to cloud… {Math.round(upload.progress * 100)}%
      </span>
    );
  }
  if (upload.phase === "uploaded") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" /> Saved — instant sharing
      </span>
    );
  }
  if (upload.phase === "failed") {
    return (
      <button
        type="button"
        onClick={() => retryUpload(id)}
        className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:underline"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Upload failed — retry
      </button>
    );
  }
  return null;
}

export interface RecordingCardProps {
  rec: LibraryItem;
  busy: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: (id: string) => void;
  onTogglePin: (rec: LibraryItem) => void;
  onOpenEditor: (id: string) => void;
  onView: (shareId: string) => void;
  onCopy: (shareId: string) => void;
  onGetLink: (rec: LibraryItem) => void;
  onUnpublish: (rec: LibraryItem) => void;
  onDownload: (rec: LibraryItem) => void;
  onRequestDelete: (id: string) => void;
}

/** A single recording tile in the Library grid. */
export function RecordingCard({
  rec,
  busy,
  selectable = false,
  selected = false,
  onToggleSelected,
  onTogglePin,
  onOpenEditor,
  onView,
  onCopy,
  onGetLink,
  onUnpublish,
  onDownload,
  onRequestDelete,
}: RecordingCardProps) {
  return (
    <div
      className={`group relative flex flex-col border-2 border-foreground bg-card shadow-md transition-transform hover:-translate-y-1 ${
        selectable && selected ? "ring-2 ring-accent ring-offset-2" : ""
      }`}
    >
      {rec.remote && !selectable ? null : selectable ? (
        <label
          title={selected ? "Deselect recording" : "Select recording"}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-foreground bg-background shadow-sm transition-colors hover:bg-accent"
        >
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelected?.(rec.id)}
            aria-label={`Select recording “${rec.title}”`}
            className="h-5 w-5 border-foreground"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => onTogglePin(rec)}
          aria-pressed={rec.pinned}
          title={rec.pinned ? "Unpin recording" : "Pin recording"}
          className={`absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-sm border border-foreground shadow-sm transition-colors ${
            rec.pinned
              ? "bg-accent text-accent-foreground"
              : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {rec.pinned ? (
            <Pin className="h-4 w-4 fill-current" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
          <span className="sr-only">
            {rec.pinned ? "Unpin recording" : "Pin recording"}
          </span>
        </button>
      )}
      <button
        type="button"
        className="block text-left"
        onClick={() =>
          selectable
            ? onToggleSelected?.(rec.id)
            : rec.remote && rec.shareId
              ? onView(rec.shareId)
              : onOpenEditor(rec.id)
        }
      >
        <Thumb rec={rec} />
      </button>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          {rec.visibility === "public" ? (
            <Badge className="border border-foreground bg-primary text-primary-foreground">
              <Globe className="mr-1 h-3 w-3" /> Public
            </Badge>
          ) : (
            <Badge variant="outline" className="border border-foreground">
              <Lock className="mr-1 h-3 w-3" /> Private
            </Badge>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {formatRelativeDate(rec.createdAt)}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">
          {rec.title}
        </h3>

        {rec.remote ? (
          <div className="mt-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              {rec.remoteStatus === "pending" ? (
                <>
                  <UploadCloud className="h-3.5 w-3.5 animate-pulse" />
                  Uploading from another device…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> In your cloud library
                </>
              )}
            </span>
          </div>
        ) : (
          rec.visibility !== "public" &&
          cloudEnabled && (
            <div className="mt-2">
              <UploadStatus id={rec.id} />
            </div>
          )
        )}

        <div className="mt-4 flex items-center gap-2">
          {rec.remote && rec.remoteStatus === "pending" ? (
            <Button
              size="sm"
              disabled
              className="flex-1 border border-foreground bg-accent font-bold text-accent-foreground"
            >
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Uploading…
            </Button>
          ) : !cloudEnabled ? (
            // Cloud unavailable (desktop without a backend): edit locally only.
            <Button
              size="sm"
              className="flex-1 border border-foreground bg-accent font-bold text-accent-foreground"
              onClick={() => onOpenEditor(rec.id)}
            >
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          ) : rec.visibility === "public" && rec.shareId ? (
            <Button
              size="sm"
              className="flex-1 border border-foreground bg-accent font-bold text-accent-foreground"
              onClick={() => onCopy(rec.shareId!)}
            >
              <Share2 className="mr-1 h-4 w-4" /> Copy link
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 border border-foreground bg-accent font-bold text-accent-foreground"
              disabled={busy}
              onClick={() => onGetLink(rec)}
            >
              {busy ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-1 h-4 w-4" />
              )}
              Get public link
            </Button>
          )}

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="More actions"
                    className="border border-foreground px-2 font-bold"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>More actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              className="border-2 border-foreground"
            >
              {rec.remote ? (
                rec.shareId && (
                  <DropdownMenuItem
                    className="font-medium"
                    onSelect={() => onView(rec.shareId!)}
                  >
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                )
              ) : (
                <DropdownMenuItem
                  className="font-medium"
                  onSelect={() => onOpenEditor(rec.id)}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {rec.visibility === "public" && rec.shareId && (
                <>
                  {!rec.remote && (
                    <DropdownMenuItem
                      className="font-medium"
                      onSelect={() => onView(rec.shareId!)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="font-medium"
                    disabled={busy}
                    onSelect={() => onUnpublish(rec)}
                  >
                    <Lock className="mr-2 h-4 w-4" /> Unpublish
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                className="font-medium"
                disabled={rec.remote && rec.remoteStatus === "pending"}
                onSelect={() => onDownload(rec)}
              >
                <DownloadIcon className="mr-2 h-4 w-4" /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-medium text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onSelect={() => onRequestDelete(rec.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
