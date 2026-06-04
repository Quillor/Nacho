---
name: Clerk admin impersonation (log in as user)
description: How "Log in as user" impersonation is implemented against Replit-managed Clerk.
---

Admin "Log in as user" mints a Clerk **actor token** server-side and redirects the
browser to a sign-in ticket URL:

- `clerkClient.actorTokens.create({ userId, actor: { sub: adminUserId }, expiresInSeconds })`
- The returned `token` is nullable — guard it before use.
- Frontend redirects to `/sign-in?__clerk_ticket=<token>`.

**Why:** Actor tokens are Clerk's supported impersonation primitive; the ticket
flow swaps the current session for the target user while recording the acting
admin. This works because Nacho is served at root `/` and shares the Clerk
session/domain with the admin app — the ticket lands the operator in the real app
as that user.

**How to apply:** Keep the redirect target on the same Clerk domain/session. If
the consuming app moves off root, revisit the ticket URL base.
