---
name: Published recording sync model
description: How edits to an already-published recording reach the public page/share link.
---
# Published recording sync model

Editing trim/chapters/description on an already-public recording must re-sync to the
Postgres server copy, otherwise viewers of the share link see the originally-published
content. There is no unpublish/republish needed.

- **Trim is metadata-only.** The video blob is never re-encoded on trim — `trimStart`/`trimEnd`
  are stored and the public view seeks to `trimStart`. The only media derived from trim is the
  GIF preview (used for OG unfurl). So "re-sync media if trim changed" means: regenerate + re-upload
  the GIF, not the video.
- `syncPublishedRecording()` in `lib/publish.ts` PATCHes `/api/recordings/:shareId` (owner-scoped,
  `credentials:"include"`) with editable fields + optional fresh `gifPath`. `getPublicLink()` now
  also calls it for already-published recordings before flipping visibility public.
- Editor "Save changes" (`pages/editor.tsx` `handleSave`) syncs when the recording is public;
  it regenerates the GIF only when trim changed (compares state vs loaded `rec` values).

**Why:** the old `getPublicLink` only re-uploaded for never-published recordings; for published
ones it just flipped visibility, so edits silently never reached viewers.
