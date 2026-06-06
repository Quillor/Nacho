---
name: Repo file-size budget
description: The 400-line file-size guardrail and how to satisfy it.
---

`scripts/src/check-file-size.ts` enforces a **400-line** cap across the repo
(`pnpm run check-file-size`).

- `PERMANENT_EXEMPTIONS`: inherently-large files with no logic to split (e.g. generated data lists, vendored shadcn primitives).
- `LEGACY_ALLOWLIST`: temporary; each entry names the owning reorg task and must be removed when that task splits the file.

**Why:** keeps files focused; reorg tasks are expected to delete their allowlist entries, not extend them.

**How to apply:** when a file exceeds 400 lines, split it (extract a hook, sub-components, or a helper module). Do NOT add new LEGACY_ALLOWLIST entries to dodge the check.
