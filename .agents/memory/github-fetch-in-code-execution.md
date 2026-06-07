---
name: Fetching from GitHub in this repl
description: How to git fetch/merge from a GitHub repo when only the Replit integration (no git remote) is configured
---

# Fetching from GitHub when only the integration exists

There is **no `origin`/github.com git remote** in this workspace — only Replit's
`gitsafe-backup` and many `subrepl-*` remotes. The GitHub repo is `Quillor/Nacho`,
reachable only through the installed GitHub **integration** connection.

To fetch/pull from GitHub:

- Get the token at runtime in the code-execution sandbox:
  `const token = (await listConnections('github'))[0].settings.access_token;`
  Never print it or write it to git config.
- Authenticate git over HTTPS with **Basic** auth (GitHub's git endpoint rejects
  `Authorization: Bearer ...`). Pass it via env so it stays out of argv and config:
  - `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=http.extraheader`,
    `GIT_CONFIG_VALUE_0=Authorization: Basic <base64("x-access-token:"+token)>`
- Fetch ad-hoc (don't add a stored remote): `git fetch https://github.com/Quillor/Nacho.git main`.
  FETCH_HEAD then records only the plain URL + sha (no token).

**Why:** keeps the OAuth token out of `.git/config`, argv, and FETCH_HEAD.
**How to apply:** any pull/fetch/merge from GitHub here. Run it inside an assigned
project task (destructive git is gated outside tasks).

## code_execution git gotcha
`child_process` git in the code-execution sandbox uses a **different HOME**, so the
global git identity is invisible and commits/merges fail with "Committer identity
unknown". Pass identity explicitly via env: `GIT_AUTHOR_NAME/EMAIL` +
`GIT_COMMITTER_NAME/EMAIL` (repo uses `Quillor` / `info@quillor.com`).
