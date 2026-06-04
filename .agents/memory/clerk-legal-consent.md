---
name: Clerk legal-consent signup gate
description: How to enable the Terms-of-Service consent checkbox at Clerk signup in this Replit-managed Clerk instance.
---

Clerk's "Require legal consent" checkbox at signup is NOT settable via the Clerk
Backend API (`instance.update` exposes no legal/consent fields). It is configured
in the Clerk **Auth pane** (a user/dashboard action), where you also set the
Terms URL.

**Why:** Replit-managed Clerk routes consent config through the Auth pane, not the
public Backend API. Attempting to script it via `clerkClient` will silently no-op.
Building a custom signup form to add the checkbox is disallowed (must use Clerk's
prebuilt `<SignUp>`).

**How to apply:** When a task needs a ToS/consent gate at signup, build the public
Terms page (here: Nacho `/terms`, DB-backed `tos_document`), then surface to the
user: enable "Require legal consent" in the Clerk Auth pane and set the Terms URL
to `/terms`. Do not try to automate it or hand-roll the signup UI.
