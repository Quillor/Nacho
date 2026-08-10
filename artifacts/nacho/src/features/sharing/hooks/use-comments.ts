// Timeline-comment state for the public view: list, add, edit, resolve and
// delete, plus the "sign in to save" handoff — a signed-out visitor can write
// a comment, and the draft survives the round-trip through sign-in via
// localStorage so nothing they typed is lost.

import { useCallback, useEffect, useState } from "react";
import { apiPath, authHeaders } from "@/lib/desktop-api";

export interface RecordingComment {
  id: number;
  timeSec: number;
  body: string;
  resolved: boolean;
  authorName: string;
  mine: boolean;
  createdAt: string;
}

export class SignInRequiredError extends Error {
  constructor() {
    super("Sign in to comment");
    this.name = "SignInRequiredError";
  }
}

const draftKey = (shareId: string) => `nacho-comment-draft:${shareId}`;

/** Persist a not-yet-posted comment across the sign-in round trip. */
export function saveCommentDraft(
  shareId: string,
  draft: { body: string; timeSec: number },
): void {
  try {
    localStorage.setItem(draftKey(shareId), JSON.stringify(draft));
  } catch {
    /* storage unavailable — the draft just doesn't survive */
  }
}

export function takeCommentDraft(
  shareId: string,
): { body: string; timeSec: number } | null {
  try {
    const raw = localStorage.getItem(draftKey(shareId));
    if (!raw) return null;
    localStorage.removeItem(draftKey(shareId));
    const parsed = JSON.parse(raw) as { body?: unknown; timeSec?: unknown };
    if (typeof parsed.body !== "string") return null;
    return {
      body: parsed.body,
      timeSec: typeof parsed.timeSec === "number" ? parsed.timeSec : 0,
    };
  } catch {
    return null;
  }
}

async function commentHeaders(): Promise<Record<string, string>> {
  return { "Content-Type": "application/json", ...(await authHeaders()) };
}

export function useComments(shareId: string, enabled: boolean) {
  const [comments, setComments] = useState<RecordingComment[]>([]);
  const [canModerate, setCanModerate] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!shareId) return;
    try {
      const res = await fetch(apiPath(`/api/recordings/${shareId}/comments`), {
        credentials: "include",
        headers: { ...(await authHeaders()) },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        comments: RecordingComment[];
        canModerate: boolean;
      };
      setComments(data.comments);
      setCanModerate(data.canModerate);
      setLoaded(true);
    } catch {
      /* offline — leave whatever we had */
    }
  }, [shareId]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const add = useCallback(
    async (timeSec: number, body: string): Promise<RecordingComment> => {
      const res = await fetch(apiPath(`/api/recordings/${shareId}/comments`), {
        method: "POST",
        credentials: "include",
        headers: await commentHeaders(),
        body: JSON.stringify({ timeSec, body }),
      });
      if (res.status === 401) throw new SignInRequiredError();
      if (!res.ok) throw new Error("Failed to post comment");
      const comment = (await res.json()) as RecordingComment;
      setComments((prev) =>
        [...prev, comment].sort(
          (a, b) => a.timeSec - b.timeSec || a.id - b.id,
        ),
      );
      return comment;
    },
    [shareId],
  );

  const update = useCallback(
    async (
      id: number,
      patch: Partial<Pick<RecordingComment, "body" | "timeSec" | "resolved">>,
    ): Promise<void> => {
      const res = await fetch(
        apiPath(`/api/recordings/${shareId}/comments/${id}`),
        {
          method: "PATCH",
          credentials: "include",
          headers: await commentHeaders(),
          body: JSON.stringify(patch),
        },
      );
      if (!res.ok) throw new Error("Failed to update comment");
      const comment = (await res.json()) as RecordingComment;
      setComments((prev) => prev.map((c) => (c.id === id ? comment : c)));
    },
    [shareId],
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      const res = await fetch(
        apiPath(`/api/recordings/${shareId}/comments/${id}`),
        {
          method: "DELETE",
          credentials: "include",
          headers: { ...(await authHeaders()) },
        },
      );
      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to delete comment");
      }
      setComments((prev) => prev.filter((c) => c.id !== id));
    },
    [shareId],
  );

  return { comments, canModerate, loaded, refresh, add, update, remove };
}
