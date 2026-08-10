import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare,
  Check,
  Pencil,
  Trash2,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { formatTimestamp, formatRelativeDate } from "@workspace/shared";
import { cn } from "@/lib/utils";
import {
  useComments,
  saveCommentDraft,
  takeCommentDraft,
  SignInRequiredError,
  type RecordingComment,
} from "../hooks/use-comments";

/**
 * Timestamped comments under a public recording. Anyone can write; posting
 * requires an account — a signed-out visitor's draft is stashed locally,
 * they're sent through sign-in, and the draft is restored when they're back.
 * Open (unresolved) comments show by default; resolved ones sit behind a
 * toggle. Timestamp chips seek the player.
 */
export function CommentsSection({
  shareId,
  currentTime,
  onSeek,
  onCommentsChanged,
}: {
  shareId: string;
  currentTime: number;
  onSeek: (time: number) => void;
  /** Notifies the page so the player's timeline markers stay in sync. */
  onCommentsChanged?: (open: RecordingComment[]) => void;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { comments, canModerate, add, update, remove } = useComments(
    shareId,
    true,
  );

  const [body, setBody] = useState("");
  const [anchor, setAnchor] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const restored = useRef(false);

  // Restore a draft stashed before the sign-in round trip.
  useEffect(() => {
    if (restored.current || !shareId) return;
    restored.current = true;
    const draft = takeCommentDraft(shareId);
    if (draft) {
      setBody(draft.body);
      setAnchor(draft.timeSec);
      toast({
        title: "Draft restored",
        description: "Your comment is ready — hit Post to save it.",
      });
    }
  }, [shareId, toast]);

  const open = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);
  const visible = showResolved ? resolved : open;

  useEffect(() => {
    onCommentsChanged?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  const effectiveAnchor = anchor ?? currentTime;

  const post = async () => {
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    try {
      await add(effectiveAnchor, text);
      setBody("");
      setAnchor(null);
      toast({ title: "Comment posted" });
    } catch (err) {
      if (err instanceof SignInRequiredError) {
        saveCommentDraft(shareId, { body: text, timeSec: effectiveAnchor });
        toast({
          title: "Sign in to save your comment",
          description: "We saved your draft — it'll be here when you're back.",
        });
        navigate("/sign-in");
      } else {
        toast({
          title: "Couldn't post comment",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setPosting(false);
    }
  };

  const act = async (fn: () => Promise<void>, failTitle: string) => {
    try {
      await fn();
    } catch {
      toast({ title: failTitle, variant: "destructive" });
    }
  };

  const iconBtn =
    "flex h-8 w-8 items-center justify-center border border-foreground bg-background transition-colors hover:bg-muted";

  return (
    <section data-pico-section="comments" className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
          <MessageSquare className="h-5 w-5" /> Comments
          <span className="text-base font-bold text-muted-foreground">
            {open.length} open
          </span>
        </h2>
        {resolved.length > 0 && (
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            aria-pressed={showResolved}
            className="border border-foreground bg-card px-3 py-1.5 text-sm font-bold transition-colors hover:bg-muted"
          >
            {showResolved
              ? "Show open comments"
              : `Show resolved (${resolved.length})`}
          </button>
        )}
      </div>

      <div className="border-2 border-foreground bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(currentTime)}
            title="Anchor the comment to the current playback position"
            className="flex items-center gap-1.5 border border-foreground bg-accent px-2 py-1 font-mono text-xs font-bold text-accent-foreground"
          >
            <Clock className="h-3.5 w-3.5" />
            {formatTimestamp(effectiveAnchor)}
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            Comment is pinned to this moment — click the chip to re-pin to the
            playhead.
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => {
            // Pin the anchor the moment they start typing so playback drifting
            // on doesn't move their comment.
            if (anchor === null && e.target.value) setAnchor(currentTime);
            setBody(e.target.value);
          }}
          rows={2}
          placeholder="Leave a comment at this moment…"
          className="w-full resize-y border border-foreground bg-background p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            disabled={posting || body.trim().length === 0}
            onClick={() => void post()}
            className="border border-foreground bg-accent font-bold text-accent-foreground"
          >
            Post comment
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visible.length === 0 && (
          <p className="text-sm font-medium text-muted-foreground">
            {showResolved
              ? "No resolved comments."
              : "No open comments yet — be the first."}
          </p>
        )}
        {visible.map((c) => (
          <div
            key={c.id}
            id={`comment-${c.id}`}
            className={cn(
              "border-2 border-foreground bg-card p-4",
              c.resolved && "opacity-70",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSeek(c.timeSec)}
                className="border border-foreground bg-accent px-2 py-0.5 font-mono text-xs font-bold text-accent-foreground"
              >
                {formatTimestamp(c.timeSec)}
              </button>
              <span className="text-sm font-bold">{c.authorName}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {formatRelativeDate(new Date(c.createdAt).getTime())}
              </span>
              {c.resolved && (
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Resolved
                </span>
              )}
              <span className="ml-auto flex items-center gap-1.5">
                {(c.mine || canModerate) && (
                  <button
                    type="button"
                    title={c.resolved ? "Reopen" : "Resolve"}
                    aria-label={
                      c.resolved ? "Reopen comment" : "Resolve comment"
                    }
                    onClick={() =>
                      void act(
                        () => update(c.id, { resolved: !c.resolved }),
                        "Couldn't update comment",
                      )
                    }
                    className={iconBtn}
                  >
                    {c.resolved ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                )}
                {c.mine && (
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit comment"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditBody(c.body);
                    }}
                    className={iconBtn}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {(c.mine || canModerate) && (
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete comment"
                    onClick={() =>
                      void act(() => remove(c.id), "Couldn't delete comment")
                    }
                    className={cn(iconBtn, "text-destructive")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </span>
            </div>
            {editingId === c.id ? (
              <div className="mt-2">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  className="w-full resize-y border border-foreground bg-background p-2 text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                    className="border border-foreground font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={editBody.trim().length === 0}
                    onClick={() =>
                      void act(async () => {
                        await update(c.id, { body: editBody.trim() });
                        setEditingId(null);
                      }, "Couldn't update comment")
                    }
                    className="border border-foreground bg-accent font-bold text-accent-foreground"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
