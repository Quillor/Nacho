---
name: View counting trigger
description: When a published-recording view is registered (count + owner email)
---

A published recording's view is registered only when the share link is opened
AND playback actually starts — never on mere page load. Deduped to once per
viewing session.

**Why:** Product wants the view count and the "Notify me when viewed" email to
reflect genuine watches, not page impressions. The count and the notification
must share one definition so they never diverge.

**How to apply:** Keep the view trigger tied to playback start, and keep the
count and the owner-notification firing from the same server event. Don't move
view registration back to page load, and don't split the count and the email
onto different triggers.
