---
name: Resend connector binding vs "INSTALLED"
description: Why the connectors proxy can 401 for Resend even when the env header says the integration is installed.
---

The environment header listing an integration as `INSTALLED and configured` (e.g.
`resend==1.0.0 (INSTALLED)`) only means the **npm package** is present. It does
NOT mean this Repl is bound as a permitted consumer of the connection.

Symptom: `ReplitConnectors().proxy("resend", ...)` returns `401` with
`No connection found for replid: ... with connector: resend`.

**Why:** `addIntegration` does code-side wiring; the platform-side binding (which
makes the credential proxy at `connectors.replit.com` serve secrets for this Repl)
is done by `proposeIntegration`. Until `proposeIntegration` runs and the user
authorizes, the proxy serves nothing — regardless of the "INSTALLED" header.

**How to apply:** To verify a connector actually works, hit its proxy from the
package dir (module resolution needs node_modules), e.g. a GET to `/domains` for
Resend. A 401 "No connection found" means call `proposeIntegration` (exits the
agent loop; user authorizes). Email from-address: `NOTIFICATION_FROM_EMAIL` env,
fallback `Nacho <onboarding@resend.dev>` (Resend needs a verified sender).
