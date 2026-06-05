---
name: WebM Infinity duration
description: MediaRecorder WebM blobs report duration=Infinity; how the player resolves a real duration.
---

# WebM Infinity duration

MediaRecorder-produced WebM blobs commonly report `video.duration === Infinity`
from the `loadedmetadata` event. Any player math that divides by duration
(playhead %, click/drag pos→time) silently collapses to 0 if duration stays 0.

**The rule:** never trust `video.duration` alone for recorded blobs.

**How to apply:** resolve duration in this priority order —
1. reported `duration` if `Number.isFinite(d) && d > 0`;
2. else the recording's stored `durationSec` (passed in as a prop — reliable per stored metadata);
3. else the seek-past-end workaround (`v.currentTime = 1e101`, listen for `durationchange`, then restore the playhead).

VideoPlayer takes an optional `durationSec` prop; editor and public-view both pass `rec.durationSec`. Seeking still works even while the element reports Infinity, as long as the blob is fully loaded.
